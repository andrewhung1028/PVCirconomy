CREATE TABLE IF NOT EXISTS pv_panel_models (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  manufacturer text NOT NULL,
  model text NOT NULL,
  rated_watts integer NOT NULL CHECK (rated_watts > 0),
  weight_lb numeric(10,3) CHECK (weight_lb > 0),
  construction text CHECK (construction IN ('glass-backsheet','glass-glass','unknown')),
  source_url text,
  verified boolean NOT NULL DEFAULT false,
  UNIQUE (manufacturer, model)
);
CREATE TABLE IF NOT EXISTS pv_estimates (
  id uuid PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  panel_count integer NOT NULL CHECK (panel_count BETWEEN 1 AND 1000000),
  rated_watts integer NOT NULL CHECK (rated_watts BETWEEN 1 AND 2000),
  model_description text NOT NULL DEFAULT '',
  shipment_scale text NOT NULL CHECK (shipment_scale IN ('truck','trailer')),
  panel_condition text NOT NULL,
  delivery_method text NOT NULL CHECK (delivery_method IN ('dropoff','pickup')),
  us_zip text NOT NULL CHECK (us_zip ~ '^[0-9]{5}$'),
  processing_estimate_usd numeric(14,2),
  pricing_version text NOT NULL,
  status text NOT NULL DEFAULT 'estimate' CHECK (status IN ('estimate','rate-review'))
);
