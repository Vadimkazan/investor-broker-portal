ALTER TABLE investment_objects
ADD COLUMN min_investment NUMERIC DEFAULT 0,
ADD COLUMN monthly_payment NUMERIC DEFAULT 0,
ADD COLUMN strategy TEXT DEFAULT '',
ADD COLUMN deal_cycle TEXT DEFAULT '',
ADD COLUMN presentation_link TEXT DEFAULT '',
ADD COLUMN investment_decision TEXT DEFAULT '';