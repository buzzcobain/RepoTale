# Repository ingestion

Large repositories should be ingested hierarchically: discover the tree,
extract the relevant files, then progressively chunk oversized documents. Keep
directory boundaries and source paths in each chunk so generated stories can
link back to the code that produced them.
