CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE batch (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  description text,
  processing_status varchar (50),
  processing_note text,
  created_at timestamp not null default now(),
  queued_at timestamp,
  processed_at timestamp,
  verified_at timestamp
);

CREATE TABLE message (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id uuid,
  channel varchar (25) NOT NULL,
  delivery_status varchar (50),
  delivery_note text,
  created_at timestamp NOT NULL default now(),
  queued_at timestamp,
  sent_at timestamp,
  verified_at timestamp,
  check (false) NO INHERIT
);
CREATE INDEX index_message_created_at ON message(created_at);

CREATE TABLE sms (
  LIKE message INCLUDING INDEXES,
  sns_message_id uuid,
  phone_number varchar (20) NOT NULL,
  content text NOT NULL,
  FOREIGN KEY (batch_id) REFERENCES batch(id)
) INHERITS (message);
CREATE INDEX index_sms_sns_message_id ON sms(sns_message_id);

CREATE TABLE template (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  key varchar (128),
  channel varchar (25) NOT NULL,
  description text,
  content text NOT NULL,
  created_at timestamp not null default now(),
  updated_at timestamp
);
CREATE INDEX index_template_key ON template(key);