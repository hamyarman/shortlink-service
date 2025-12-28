const request = require("supertest");
const { app } = require("../src/app");
const { db } = require("../src/db");

describe("Shortlink API", () => {
  beforeEach((done) => {
    db.serialize(() => {
      db.run("DELETE FROM clicks", () => {
        db.run("DELETE FROM links", done);
      });
    });
  });

  afterAll((done) => {
    db.close(done);
  });

  test("creates a short link", async () => {
    const response = await request(app)
      .post("/api/links")
      .send({ url: "https://example.com" })
      .expect(201);

    expect(response.body.shortCode).toBeTruthy();
    expect(response.body.shortUrl).toContain(response.body.shortCode);
  });

  test("rejects invalid url", async () => {
    await request(app)
      .post("/api/links")
      .send({ url: "not-a-url" })
      .expect(400);
  });

  test("redirects and records click", async () => {
    const createResponse = await request(app)
      .post("/api/links")
      .send({ url: "https://example.com" });

    const { shortCode } = createResponse.body;

    const redirectResponse = await request(app)
      .get(`/${shortCode}`)
      .redirects(0);

    expect(redirectResponse.status).toBe(302);
    expect(redirectResponse.headers.location).toBe("https://example.com");
  });

  test("returns 404 for missing short code", async () => {
    await request(app).get("/missing").expect(404);
  });

  test("stats include incremented clicks", async () => {
    const createResponse = await request(app)
      .post("/api/links")
      .send({ url: "https://example.com" });

    const { shortCode } = createResponse.body;

    await request(app).get(`/${shortCode}`).redirects(0);

    const statsResponse = await request(app)
      .get(`/api/links/${shortCode}/stats`)
      .expect(200);

    expect(statsResponse.body.shortCode).toBe(shortCode);
    expect(statsResponse.body.originalUrl).toBe("https://example.com");
    expect(statsResponse.body.clickCount).toBe(1);
    expect(statsResponse.body.lastClickedAt).toBeTruthy();
  });
});
