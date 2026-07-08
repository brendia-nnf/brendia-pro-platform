-- Create devices table for session/device management
CREATE TABLE public.devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- User Reference
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Device Information
  device_name TEXT NOT NULL, -- e.g., "iPhone 14 Pro", "Chrome on Windows"
  device_type TEXT CHECK (device_type IN ('mobile', 'tablet', 'desktop', 'unknown')),
  browser TEXT, -- e.g., "Chrome", "Safari", "Mobile App"
  os TEXT, -- e.g., "iOS 17", "Windows 11", "Android 14"

  -- Session Information
  session_token TEXT, -- Reference to auth session if needed
  ip_address TEXT,
  user_agent TEXT,

  -- Status
  is_current BOOLEAN DEFAULT false,
  last_active TIMESTAMPTZ DEFAULT NOW(),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_devices_user_id ON public.devices(user_id);
CREATE INDEX idx_devices_last_active ON public.devices(user_id, last_active DESC);
CREATE INDEX idx_devices_is_current ON public.devices(user_id, is_current);

-- Enable RLS
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

-- Policies
-- Users can view their own devices
CREATE POLICY "Users can view own devices" ON public.devices
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can delete their own devices (logout)
CREATE POLICY "Users can delete own devices" ON public.devices
  FOR DELETE
  USING (auth.uid() = user_id);

-- Service role can manage all devices
CREATE POLICY "Service role can manage devices" ON public.devices
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to register/update device on login
CREATE OR REPLACE FUNCTION public.register_device(
  p_user_id UUID,
  p_device_name TEXT,
  p_device_type TEXT DEFAULT 'unknown',
  p_browser TEXT DEFAULT NULL,
  p_os TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_device_id UUID;
  v_device_count INTEGER;
  v_max_devices INTEGER := 3;
BEGIN
  -- Check existing device by user_agent or create new
  SELECT id INTO v_device_id
  FROM public.devices
  WHERE user_id = p_user_id
    AND user_agent = p_user_agent
  LIMIT 1;

  IF v_device_id IS NOT NULL THEN
    -- Update existing device
    UPDATE public.devices SET
      is_current = true,
      last_active = NOW(),
      ip_address = COALESCE(p_ip_address, ip_address)
    WHERE id = v_device_id;
  ELSE
    -- Check device limit
    SELECT COUNT(*) INTO v_device_count
    FROM public.devices
    WHERE user_id = p_user_id;

    IF v_device_count >= v_max_devices THEN
      -- Remove oldest non-current device
      DELETE FROM public.devices
      WHERE id = (
        SELECT id FROM public.devices
        WHERE user_id = p_user_id AND is_current = false
        ORDER BY last_active ASC
        LIMIT 1
      );
    END IF;

    -- Insert new device
    INSERT INTO public.devices (
      user_id, device_name, device_type, browser, os, ip_address, user_agent, is_current
    ) VALUES (
      p_user_id, p_device_name, p_device_type, p_browser, p_os, p_ip_address, p_user_agent, true
    ) RETURNING id INTO v_device_id;
  END IF;

  -- Mark all other devices as not current
  UPDATE public.devices
  SET is_current = false
  WHERE user_id = p_user_id AND id != v_device_id;

  RETURN v_device_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's device count
CREATE OR REPLACE FUNCTION public.get_device_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM public.devices WHERE user_id = p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
