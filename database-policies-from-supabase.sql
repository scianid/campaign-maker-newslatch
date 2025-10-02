CREATE POLICY "Admins can delete RSS feeds" ON "public"."rss_feeds" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));


CREATE POLICY "Admins can insert RSS feeds" ON "public"."rss_feeds" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));


CREATE POLICY "Admins can update RSS feeds" ON "public"."rss_feeds" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));


CREATE POLICY "Admins can view all RSS feeds" ON "public"."rss_feeds" FOR SELECT USING ((("auth"."uid"() IS NOT NULL) AND (("is_active" = true) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))))));


CREATE POLICY "Authenticated users can view active RSS feeds" ON "public"."rss_feeds" FOR SELECT USING ((("auth"."uid"() IS NOT NULL) AND ("is_active" = true)));


CREATE POLICY "Users can delete AI items for their campaigns" ON "public"."ai_generated_items" FOR DELETE USING (("campaign_id" IN ( SELECT "campaigns"."id"
   FROM "public"."campaigns"
  WHERE ("campaigns"."user_id" = "auth"."uid"()))));


CREATE POLICY "Users can delete landing pages for their AI items" ON "public"."landing_pages" FOR DELETE USING (("ai_generated_item_id" IN ( SELECT "ai"."id"
   FROM ("public"."ai_generated_items" "ai"
     JOIN "public"."campaigns" "c" ON (("ai"."campaign_id" = "c"."id")))
  WHERE ("c"."user_id" = "auth"."uid"()))));


CREATE POLICY "Users can delete own campaigns" ON "public"."campaigns" FOR DELETE USING (("auth"."uid"() = "user_id"));


CREATE POLICY "Users can delete their own landing pages" ON "public"."landing_pages" FOR DELETE USING (("ai_generated_item_id" IN ( SELECT "ai"."id"
   FROM ("public"."ai_generated_items" "ai"
     JOIN "public"."campaigns" "c" ON (("ai"."campaign_id" = "c"."id")))
  WHERE ("c"."user_id" = "auth"."uid"()))));


CREATE POLICY "Users can insert AI items for their campaigns" ON "public"."ai_generated_items" FOR INSERT WITH CHECK (("campaign_id" IN ( SELECT "campaigns"."id"
   FROM "public"."campaigns"
  WHERE ("campaigns"."user_id" = "auth"."uid"()))));


CREATE POLICY "Users can insert landing pages for their AI items" ON "public"."landing_pages" FOR INSERT WITH CHECK (("ai_generated_item_id" IN ( SELECT "ai"."id"
   FROM ("public"."ai_generated_items" "ai"
     JOIN "public"."campaigns" "c" ON (("ai"."campaign_id" = "c"."id")))
  WHERE ("c"."user_id" = "auth"."uid"()))));


CREATE POLICY "Users can insert own campaigns" ON "public"."campaigns" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));


CREATE POLICY "Users can insert their own landing pages" ON "public"."landing_pages" FOR INSERT WITH CHECK (("ai_generated_item_id" IN ( SELECT "ai"."id"
   FROM ("public"."ai_generated_items" "ai"
     JOIN "public"."campaigns" "c" ON (("ai"."campaign_id" = "c"."id")))
  WHERE ("c"."user_id" = "auth"."uid"()))));


CREATE POLICY "Users can update AI items for their campaigns" ON "public"."ai_generated_items" FOR UPDATE USING (("campaign_id" IN ( SELECT "campaigns"."id"
   FROM "public"."campaigns"
  WHERE ("campaigns"."user_id" = "auth"."uid"()))));


CREATE POLICY "Users can update landing pages for their AI items" ON "public"."landing_pages" FOR UPDATE USING (("ai_generated_item_id" IN ( SELECT "ai"."id"
   FROM ("public"."ai_generated_items" "ai"
     JOIN "public"."campaigns" "c" ON (("ai"."campaign_id" = "c"."id")))
  WHERE ("c"."user_id" = "auth"."uid"()))));


CREATE POLICY "Users can update own campaigns" ON "public"."campaigns" FOR UPDATE USING (("auth"."uid"() = "user_id"));


CREATE POLICY "Users can update their own landing pages" ON "public"."landing_pages" FOR UPDATE USING (("ai_generated_item_id" IN ( SELECT "ai"."id"
   FROM ("public"."ai_generated_items" "ai"
     JOIN "public"."campaigns" "c" ON (("ai"."campaign_id" = "c"."id")))
  WHERE ("c"."user_id" = "auth"."uid"())))) WITH CHECK (("ai_generated_item_id" IN ( SELECT "ai"."id"
   FROM ("public"."ai_generated_items" "ai"
     JOIN "public"."campaigns" "c" ON (("ai"."campaign_id" = "c"."id")))
  WHERE ("c"."user_id" = "auth"."uid"()))));


CREATE POLICY "Users can view AI items for their campaigns" ON "public"."ai_generated_items" FOR SELECT USING (("campaign_id" IN ( SELECT "campaigns"."id"
   FROM "public"."campaigns"
  WHERE ("campaigns"."user_id" = "auth"."uid"()))));


CREATE POLICY "Users can view landing pages for their AI items" ON "public"."landing_pages" FOR SELECT USING (("ai_generated_item_id" IN ( SELECT "ai"."id"
   FROM ("public"."ai_generated_items" "ai"
     JOIN "public"."campaigns" "c" ON (("ai"."campaign_id" = "c"."id")))
  WHERE ("c"."user_id" = "auth"."uid"()))));


CREATE POLICY "Users can view own campaigns" ON "public"."campaigns" FOR SELECT USING (("auth"."uid"() = "user_id"));


CREATE POLICY "Users can view their own landing pages" ON "public"."landing_pages" FOR SELECT USING (("ai_generated_item_id" IN ( SELECT "ai"."id"
   FROM ("public"."ai_generated_items" "ai"
     JOIN "public"."campaigns" "c" ON (("ai"."campaign_id" = "c"."id")))
  WHERE ("c"."user_id" = "auth"."uid"()))));


ALTER TABLE "public"."ai_generated_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."campaigns" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."landing_pages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rss_feeds" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "service_role_full_access" ON "public"."profiles" USING ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text"));


CREATE POLICY "users_insert_own_profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));


CREATE POLICY "users_select_own_profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));


CREATE POLICY "users_update_own_profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK ((("auth"."uid"() = "id") AND ("is_admin" = ( SELECT COALESCE("p"."is_admin", false) AS "coalesce"
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"())))));


