CREATE TABLE public.integration_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name text NOT NULL UNIQUE,
  value_ciphertext text NOT NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.integration_credentials TO service_role;

ALTER TABLE public.integration_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No direct access to integration credentials"
  ON public.integration_credentials
  FOR SELECT
  USING (false);

CREATE TRIGGER integration_credentials_updated_at
  BEFORE UPDATE ON public.integration_credentials
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();