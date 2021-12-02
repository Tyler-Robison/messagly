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

        let u1 = await User.register({
            username: "test1",
            password: "password",
            first_name: "Test1",
            last_name: "Testy1",
            phone: "+14155550000",
        });

        testUserToken = jwt.sign({ username: "test1" }, SECRET_KEY);
    });

    test("can get list of users", async function () {
        let response = await request(app)
            .get("/users")
            .send({ _token: testUserToken });

        expect(response.statusCode).toEqual(200)
        expect(response.body).toEqual([{
            username: "test1",
            first_name: "Test1",
            last_name: "Testy1",
            phone: "+14155550000"
        }]);
    });

    test("Can't get list if not logged in", async function () {
        let response = await request(app)
            .get("/users")
            .send({ _token: 'bad token' });

        expect(response.statusCode).toEqual(401)
    });

    test("GET user info on self", async function () {
        let response = await request(app)
            .get("/users/test1")
            .send({ _token: testUserToken });

        expect(response.statusCode).toEqual(200)
        expect(response.body).toEqual({
            username: "test1",
            first_name: "Test1",
            last_name: "Testy1",
            phone: "+14155550000",
            join_at: expect.any(String),
            last_login_at: null
        });
    });

    test("Can't get user info on someone else", async function () {
        let response = await request(app)
            .get("/users/test2")
            .send({ _token: testUserToken });

        expect(response.statusCode).toEqual(401)
    });

    test("Bad username", async function () {
        let response = await request(app)
            .get("/users/bad_username")
            .send({ _token: testUserToken });

        // ensureCorrectUser middleware gives 401 before route would give 404
        expect(response.statusCode).toEqual(401)
    });
});


describe("User Messages Routes Test", function () {

    let testUserToken;

    beforeEach(async function () {
        await db.query("DELETE FROM messages");
        await db.query("DELETE FROM users");

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

        testUserToken = jwt.sign({ username: "test1" }, SECRET_KEY);
    });


    test("can get list of messages for user", async function () {
        let response = await request(app)
            .get("/users/test1/to")
            .send({ _token: testUserToken });

        expect(response.statusCode).toEqual(200)
        expect(response.body).toEqual({
            messages: [
                {
                    id: expect.any(Number),
                    body: "test2 -> test1",
                    sent_at: expect.any(String),
                    read_at: null,
                    from_user: {
                        username: "test2",
                        first_name: "Test2",
                        last_name: "Testy2",
                        phone: "+14155552222",
                    }
                }
            ]
        });
    });

    test("can't get list of messages for another user", async function () {
        let response = await request(app)
            .get("/users/other_user/to")
            .send({ _token: testUserToken });

        expect(response.statusCode).toEqual(401)
    });

    test("401 on non-existent user", async function () {
        let response = await request(app)
            .get("/users/wrong/to")
            .send({ _token: testUserToken });
        expect(response.statusCode).toEqual(401);
    });

    test("401 on wrong auth", async function () {
        let response = await request(app)
            .get("/users/test1/to")
            .send({ _token: "wrong" });
        expect(response.statusCode).toEqual(401);
    });

    test("GET list of messages sent by self", async function () {
        let response = await request(app)
            .get("/users/test1/from")
            .send({ _token: testUserToken });

        expect(response.statusCode).toEqual(200)
        expect(response.body).toEqual({
            messages: [
                {
                    id: expect.any(Number),
                    body: "test1 -> test2",
                    sent_at: expect.any(String),
                    read_at: null,
                    to_user: {
                        username: "test2",
                        first_name: "Test2",
                        last_name: "Testy2",
                        phone: "+14155552222",
                    }
                }
            ]
        });
    });

    test("Can't get list of messages sent from another user", async function () {
        let response = await request(app)
            .get("/users/bad_user/from")
            .send({ _token: testUserToken });

        expect(response.statusCode).toEqual(401)

    });

    test("401 on non-existent user", async function () {
        let response = await request(app)
            .get("/users/wrong/from")
            .send({ _token: testUserToken });
        expect(response.statusCode).toEqual(401);
    });

    test("401 on wrong auth", async function () {
        let response = await request(app)
            .get("/users/test1/from")
            .send({ _token: "wrong" });
        expect(response.statusCode).toEqual(401);
    });



});

afterAll(async function () {
    await db.query("DELETE FROM messages");
    await db.query("DELETE FROM users");
    await db.end();
  });