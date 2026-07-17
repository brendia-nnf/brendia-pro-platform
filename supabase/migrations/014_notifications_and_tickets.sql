-- =====================================================
-- NOTIFICATIONS + SUPPORT TICKETS (MESSAGES)
-- =====================================================

-- 1. Notifications shown behind the dashboard bell
CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  type TEXT NOT NULL CHECK (
    type IN ('photo_review', 'certification', 'order', 'message', 'system')
  ),
  title TEXT NOT NULL,
  body TEXT,
  link TEXT, -- in-app path to open when clicked (e.g. /poruke/<id>)

  is_read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_notifications_user
  ON public.notifications(user_id, is_read, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can mark own notifications read" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage notifications" ON public.notifications
  FOR ALL USING (true) WITH CHECK (true);

-- 2. Support tickets (admin <-> student conversations)
CREATE TABLE public.tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  subject TEXT NOT NULL,
  status TEXT DEFAULT 'open' NOT NULL CHECK (
    status IN ('open', 'answered', 'closed')
  ),
  created_by TEXT DEFAULT 'student' NOT NULL CHECK (
    created_by IN ('student', 'admin')
  ),

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_message_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_tickets_user ON public.tickets(user_id, last_message_at DESC);
CREATE INDEX idx_tickets_status ON public.tickets(status, last_message_at DESC);

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tickets" ON public.tickets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tickets" ON public.tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id AND created_by = 'student');

CREATE POLICY "Service role can manage tickets" ON public.tickets
  FOR ALL USING (true) WITH CHECK (true);

-- 3. Ticket messages
CREATE TABLE public.ticket_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('student', 'admin')),

  body TEXT NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  read_at TIMESTAMPTZ -- when the counterpart read it
);

CREATE INDEX idx_ticket_messages_ticket
  ON public.ticket_messages(ticket_id, created_at ASC);

ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages of own tickets" ON public.ticket_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = ticket_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can reply to own tickets" ON public.ticket_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND sender_role = 'student'
    AND EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = ticket_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage ticket messages" ON public.ticket_messages
  FOR ALL USING (true) WITH CHECK (true);
