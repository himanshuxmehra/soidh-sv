
## Tables


```sql
  CREATE TABLE users (
  account_id SERIAL PRIMARY KEY,
  phone_number VARCHAR(255) UNIQUE,
  username VARCHAR(255) UNIQUE,
  password VARCHAR(255) NOT NULL
);
```

```sql
CREATE TABLE folders (
  id SERIAL PRIMARY KEY,
  folder_id UUID UNIQUE NOT NULL,
  account_id BIGINT NOT NULL,
  folder_name VARCHAR(255) NOT NULL,
  privacy BOOLEAN NOT NULL,
  CONSTRAINT fk_account FOREIGN KEY (account_id) REFERENCES users(account_id)
);

```


```sql
CREATE TABLE media (
  id SERIAL PRIMARY KEY,
  folder_id UUID NOT NULL,
  account_id BIGINT NOT NULL,
  image_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_account FOREIGN KEY (account_id) REFERENCES users(account_id),
  CONSTRAINT fk_folder FOREIGN KEY (folder_id) REFERENCES folders(folder_id)
);
```

```sql

```