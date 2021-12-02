process.env.NODE_ENV = "test";

const request = require("supertest");
const jwt = require("jsonwebtoken");

const app = require("../app");
const db = require("../db");
const User = require("../models/user");
const Message = require("../models/message");
const { SECRET_KEY } = require("../config");


describe("Message Routes Test", function () {

    let testUserToken;

    beforeEach(async function () {
        await db.query("DELETE FROM messages");
        await db.query("DELETE FROM users");
        await db.query("ALTER SEQUENCE messages_id_seq RESTART WITH 1");

        let u1 = await User.register({
            username: "test1",
            password: "password",
            first_name: "Test1",
            last_name: "Testy1",
            phone: "+14155550000",
        });

        let u2 = await User.register({
            username: "test2",
            password: "password2",
            first_name: "Test2",
            last_name: "Testy2",
            phone: "+14155552222",
        });

        let u3 = await User.register({
            username: "test3",
            password: "password3",
            first_name: "Test3",
            last_name: "Testy3",
            phone: "+14155553333",
        });

        let m1 = await Message.create({
            from_username: "test1",
            to_username: "test2",
            body: "test1 -> test2",
        });

        let m2 = await Message.create({
            from_username: "test2",
            to_username: "test1",
            body: "test2 -> test1",
        });

        let m3 = await Message.create({
            from_username: "test2",
            to_username: "test3",
            body: "test2 -> test3",
        });

        testUserToken = jwt.sign({ username: "test1" }, SECRET_KEY);
    });

    describe("GET /messages/:id", function () {
        test("can get message from user", async function () {
            let response = await request(app)
                .get("/messages/1")
                .send({ _token: testUserToken });

            expect(response.statusCode).toEqual(200)
            expect(response.body).toEqual({
                message: {
                    id: 1,
                    body: "test1 -> test2",
                    sent_at: expect.any(String),
                    read_at: null,
                    from_user: {
                        username: "test1",
                        first_name: "Test1",
                        last_name: "Testy1",
                        phone: "+14155550000"
                    },
                    to_user: {
                        username: "test2",
                        first_name: "Test2",
                        last_name: "Testy2",
                        phone: "+14155552222",
                    }
                }
            });
        });

        test("can get message to user", async function () {
            let response = await request(app)
                .get("/messages/2")
                .send({ _token: testUserToken });

            expect(response.body).toEqual({
                message: {
                    id: 2,
                    body: "test2 -> test1",
                    sent_at: expect.any(String),
                    read_at: null,
                    to_user: {
                        username: "test1",
                        first_name: "Test1",
                        last_name: "Testy1",
                        phone: "+14155550000"
                    },
                    from_user: {
                        username: "test2",
                        first_name: "Test2",
                        last_name: "Testy2",
                        phone: "+14155552222",
                    }
                }
            });
        });

        test("bad message id", async function () {
            let response = await request(app)
                .get("/messages/999")
                .send({ _token: testUserToken });

            expect(response.statusCode).toEqual(404);
        });

        // message 3 is from user2 to user3. Token is from user 1
        test("can't get message not to/from user", async function () {
            let response = await request(app)
                .get("/messages/3")
                .send({ _token: testUserToken });

            expect(response.statusCode).toEqual(401);
        });

    });

    describe("POST /", function () {
        test("can post message", async function () {
            let response = await request(app)
                .post("/messages")
                .send({
                    _token: testUserToken,
                    body: 'test message',
                    to_username: 'test2'
                });


            expect(response.statusCode).toEqual(200);
            expect(response.body).toEqual({
                message: {
                    id: 4,
                    body: "test message",
                    from_username: 'test1',
                    to_username: 'test2',
                    sent_at: expect.any(String)
                }
            });
        });

        test("cannot send to bad username", async function () {
            let response = await request(app)
            .post("/messages")
            .send({
                _token: testUserToken,
                body: 'test message',
                to_username: 'bad_user'
            });

            expect(response.statusCode).toEqual(400);

        });

        // msg 2 sent to user 1, which is token user
        test("Can mark a message as read", async function () {
            let response = await request(app)
            .post("/messages/2/read")
            .send({_token: testUserToken});

            expect(response.statusCode).toEqual(200);
            expect(response.body).toEqual({ message: 'Message Read' });
            
        });

        // msg 1 sent from user1 to user2
        test("Can't read message sent to someone else", async function () {
            let response = await request(app)
            .post("/messages/1/read")
            .send({_token: testUserToken});

            expect(response.statusCode).toEqual(401);
        });

        test("Bad msg id", async function () {
            let response = await request(app)
            .post("/messages/9999/read")
            .send({_token: testUserToken});

            expect(response.statusCode).toEqual(404);
            
        });
    });
});

afterAll(async function () {
    await db.query("DELETE FROM messages");
    await db.query("DELETE FROM users");
    await db.end();
});