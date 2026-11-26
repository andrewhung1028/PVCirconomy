import Link from 'next/link';
import { Arrow, Intro, Shell, ShopForm } from '../components/marketing';
import { products } from '../components/marketing-data';

export const metadata = { title: 'Shop | PV Circonomy' };

const equipment = [
  {
    name: 'PV Circulator',
    description: 'Industrial solar panel recycling line',
    image: '/images/pvc-machine.webp',
    href: '/shop/?type=equipment',
  },
  {
    name: 'JB Removal Tool',
    description: 'Standalone pre-processing for junction box removal',
    image: '/images/pvc-function-01.webp',
  },
];

function ShopCatalog() {
  return <div className="pc-shop-catalog">
    <h1 className="pc-visually-hidden">Shop</h1>
    <img
      className="pc-catalog-hero"
      src="/images/les-mees-solar-panels.webp"
      alt="Wave-shaped rows of solar panels with mountains in the background"
      width={1600}
      height={900}
      fetchPriority="high"
    />
    <div className="pc-catalog-sections">
      <section id="equipment" aria-labelledby="shop-equipment-title">
        <h2 id="shop-equipment-title">Equipment</h2>
        <ul className="pc-catalog-equipment">
          {equipment.map(product => (
            <li key={product.name}>
              <img src={product.image} alt="" />
              <div className="pc-catalog-details">
                <h3>{product.href ? <Link href={product.href} className="pc-catalog-link">{product.name}<Arrow /></Link> : product.name}</h3>
                <p>{product.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section id="materials" aria-labelledby="shop-materials-title">
        <h2 id="shop-materials-title">Materials</h2>
        <ul className="pc-catalog-materials">
          {products.map(product => (
            <li key={product.name}>
              <img src={'/images/material-' + product.name.toLowerCase() + '.svg'} alt="" loading="lazy" />
              <div className="pc-catalog-details">
                <h3>{product.name}</h3>
                <p>{product.form}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  </div>;
}

export default async function Shop({ searchParams }: PageProps<'/shop'>) {
  const { type, configuration, material } = await searchParams;
  if (type !== 'equipment' && type !== 'materials') return <Shell overlayHeader showMarketPicker><ShopCatalog /></Shell>;

  return <Shell showMarketPicker>
    {type === 'materials' && <Intro label="SHOP" title="Source materials" description="Tell us what recovered material you need." />}
    <ShopForm
      key={JSON.stringify([type, configuration, material])}
      type={type}
      requestedConfiguration={typeof configuration === 'string' ? configuration : undefined}
      requestedMaterial={typeof material === 'string' ? material : undefined}
    />
  </Shell>;
}
