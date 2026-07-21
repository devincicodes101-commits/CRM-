-- Conversation store for the AI Telesales Agent console. Base44 kept this on its
-- platform agents SDK; here we store the message thread (Anthropic message format)
-- as jsonb on the conversation row.

CREATE TABLE IF NOT EXISTS public.telesales_conversations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL DEFAULT 'Conversation',
  messages      jsonb NOT NULL DEFAULT '[]',
  created_by_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_date  timestamptz NOT NULL DEFAULT now(),
  updated_date  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_telesales_conv_owner ON public.telesales_conversations(created_by_id);
SELECT attach_updated_date_trigger('telesales_conversations');
ALTER TABLE public.telesales_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "telesales_conv: own or admin" ON public.telesales_conversations;
CREATE POLICY "telesales_conv: own or admin" ON public.telesales_conversations
  FOR ALL TO authenticated
  USING (created_by_id = auth.uid() OR is_admin());
