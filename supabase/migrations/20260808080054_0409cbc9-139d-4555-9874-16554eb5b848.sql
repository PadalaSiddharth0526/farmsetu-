
CREATE POLICY "soil reports insert own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'soil-reports' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "soil reports read own" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'soil-reports' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "soil reports delete own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'soil-reports' AND (storage.foldername(name))[1] = auth.uid()::text);
