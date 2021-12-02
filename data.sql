DROP DATABASE messagely;
CREATE DATABASE messagely;
\c messagely
-- make sure to use messagely_test for test db

DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS messages CASCADE;

CREATE TABLE users (
    username text PRIMARY KEY,
    password text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    phone text NOT NULL,
    join_at timestamp without time zone NOT NULL,
    last_login_at timestamp with time zone
);

CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    from_username text NOT NULL REFERENCES users ON DELETE CASCADE,
    to_username text NOT NULL REFERENCES users ON DELETE CASCADE,
    body text NOT NULL,
    sent_at timestamp with time zone NOT NULL,
    read_at timestamp with time zone
);

-- INSERT INTO users (username, password, first_name, last_name, phone, join_at)
-- VALUES ('tyler', 'turtle758', 'Tyler', 'Robison', '567-653-4567', current_timestamp),
-- ('bobby', 'dog758', 'Bobby', 'Smith', '453-223-3446', current_timestamp);

-- INSERT INTO messages (from_username, to_username, body, sent_at)
-- VALUES ('tyler', 'bobby', 'hi bobby', current_timestamp),
-- ('tyler', 'bobby', 'I like turtle', current_timestamp),
-- ('bobby', 'tyler', 'hi Tyler', current_timestamp),
-- ('bobby', 'tyler', 'delete test', current_timestamp);

-- cascade delete works
-- DELETE FROM messages
-- WHERE body = 'delete test'; 

-- tyler/turtle
-- eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InR5bGVyIiwiaWF0IjoxNjM4NDAxOTUyfQ.lIYxGe0GOEw--M3MyWdgemH0bKH3qLfjrhnENqbcoiM

-- bobbyBoy/fish
-- eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImJvYmJ5Qm95IiwiaWF0IjoxNjM4NDAxMDYyfQ.2IIhpCmo5oJucdS037wZrvq9uSc6iUnM6Xf_H5ZbHts

