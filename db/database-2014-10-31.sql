CREATE TABLE IF NOT EXISTS user (
                    id INTEGER PRIMARY KEY, 
                    session_key	TEXT);

CREATE TABLE IF NOT EXISTS product (
                    id INTEGER PRIMARY KEY, 
                    name TEXT,
                    price REAL,
                    image TEXT);

CREATE TABLE IF NOT EXISTS product_view (
                    id INTEGER PRIMARY KEY, 
                    product_id INTEGER,
                    user_id INTEGER);

CREATE TABLE IF NOT EXISTS `order` (
                    id INTEGER PRIMARY KEY, 
                    customer_name TEXT,
                    bought INTEGER);

CREATE TABLE IF NOT EXISTS order_product (
                    id INTEGER PRIMARY KEY, 
                    order_id INTEGER,
                    product_id INTEGER,
                    amount INTEGER);