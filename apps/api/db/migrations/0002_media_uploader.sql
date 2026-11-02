-- Track who uploaded a media row so a report can only attach its creator's uploads.
alter table report_media add column uploader_id uuid references profiles(id);
create index report_media_report_idx on report_media(report_id);
