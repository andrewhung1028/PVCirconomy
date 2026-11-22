import { graph } from './graph';

type Attachment = {name: string; bytes: Buffer};

/** Preserve original files; large attachments require Mail.ReadWrite + Mail.Send. */
export async function sendGraphMailWithAttachments(
  sender: string,
  message: Record<string, unknown>,
  attachments: Attachment[]
) {
  const user = `/users/${encodeURIComponent(sender)}`;
  const small = attachments.filter(a => a.bytes.length < 3000000);
  const large = attachments.filter(a => a.bytes.length >= 3000000);
  const payload = {
    ...message,
    attachments: small.map(a => ({
      '@odata.type': '#microsoft.graph.fileAttachment',
      name: a.name, contentType: 'application/pdf', contentBytes: a.bytes.toString('base64'),
    })),
  };
  if (!large.length && Buffer.byteLength(JSON.stringify(payload)) < 3900000) {
    await graph(`${user}/sendMail`, {method:'POST',body:JSON.stringify({message:payload,saveToSentItems:true})});
    return;
  }
  const draft = await graph(`${user}/messages`, {method:'POST',body:JSON.stringify(payload)});
  if (!draft?.id) throw new Error('Microsoft Graph did not create a mail draft');
  const draftPath = `${user}/messages/${encodeURIComponent(draft.id)}`;
  try {
    for (const attachment of large) {
      const session = await graph(`${draftPath}/attachments/createUploadSession`, {
        method:'POST', body:JSON.stringify({AttachmentItem:{attachmentType:'file',name:attachment.name,size:attachment.bytes.length,contentType:'application/pdf'}}),
      });
      if (!session?.uploadUrl) throw new Error('Microsoft Graph did not create an attachment upload session');
      // Upload URL is pre-authorized; do not send the bearer token to it.
      const chunkSize = 10 * 320 * 1024;
      for (let start=0;start<attachment.bytes.length;start+=chunkSize) {
        const chunk=attachment.bytes.subarray(start,Math.min(start+chunkSize,attachment.bytes.length));
        const response = await fetch(session.uploadUrl, {
          method:'PUT', headers:{'Content-Type':'application/octet-stream','Content-Length':String(chunk.length),
            'Content-Range':`bytes ${start}-${start+chunk.length-1}/${attachment.bytes.length}`},
          body:new Uint8Array(chunk),
        });
        if (!response.ok) throw new Error(`Attachment upload failed: ${response.status}`);
        if(start+chunk.length===attachment.bytes.length && response.status!==201) throw new Error('Microsoft Graph did not confirm the complete attachment');
      }
    }
    await graph(`${draftPath}/send`, {method:'POST'});
  } catch (error) {
    try {await graph(draftPath,{method:'DELETE'});} catch(cleanupError){console.error('Unable to clean up unsent mail draft',cleanupError);}
    throw error;
  }
}
