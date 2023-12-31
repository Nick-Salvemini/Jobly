"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    testJobIds,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
    const newJob = {
        title: "New",
        salary: 99000,
        equity: "0",
        companyHandle: "c1"
    };

    test("works", async function () {
        let job = await Job.create(newJob);
        expect(job).toEqual({ ...newJob, id: expect.any(Number) });
    });
});

/************************************** findJobs */

describe("findJobs", function () {
    test("works: no filter", async function () {
        let jobs = await Job.findJobs();
        expect(jobs).toEqual([
            {
                id: expect.any(Number),
                title: "j1",
                salary: 50000,
                equity: "0",
                company_handle: "c1"
            },
            {
                id: expect.any(Number),
                title: "j2",
                salary: 129000,
                equity: "0.025",
                company_handle: "c2"
            },
            {
                id: expect.any(Number),
                title: "j3",
                salary: 249000,
                equity: "0.099",
                company_handle: "c3"
            },
        ]);
    });

    test("works: by min salary", async function () {
        let jobs = await Job.findJobs({ minSalary: 200000 });
        expect(jobs).toEqual([
            {
                id: testJobIds[2],
                title: "j3",
                salary: 249000,
                equity: "0.099",
                company_handle: "c3"
            },
        ]);
    });

    test("works: by equity", async function () {
        let jobs = await Job.findJobs({ hasEquity: true });
        expect(jobs).toEqual([
            {
                id: testJobIds[1],
                title: "j2",
                salary: 129000,
                equity: "0.025",
                company_handle: "c2"
            },
            {
                id: testJobIds[2],
                title: "j3",
                salary: 249000,
                equity: "0.099",
                company_handle: "c3"
            },
        ]);
    });

    test("works: by min salary & equity", async function () {
        let jobs = await Job.findJobs({ minSalary: 150000, hasEquity: true });
        expect(jobs).toEqual([
            {
                id: testJobIds[2],
                title: "j3",
                salary: 249000,
                equity: "0.099",
                company_handle: "c3"
            },
        ]);
    });

    test("works: by name", async function () {
        let jobs = await Job.findJobs({ title: "1" });
        expect(jobs).toEqual([
            {
                id: testJobIds[0],
                title: "j1",
                salary: 50000,
                equity: "0",
                company_handle: "c1"
            },
        ]);
    });
});

/************************************** get */

describe("get", function () {
    test("works", async function () {
        let job = await Job.get(testJobIds[0]);
        expect(job).toEqual({
            id: testJobIds[0],
            title: "j1",
            salary: 50000,
            equity: "0",
            company: {
                handle: "c1",
                name: "C1",
                description: "Desc1",
                numEmployees: 1,
                logoUrl: "http://c1.img",
            },
        });
    });

    test("not found if no such job", async function () {
        try {
            await Job.get(0);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});

/************************************** update */

describe("update", function () {
    let updateData = {
        title: "New",
        salary: 500,
        equity: "0.5",
    };

    test("works", async function () {
        let job = await Job.update(testJobIds[0], updateData);
        expect(job).toEqual({
            id: testJobIds[0],
            companyHandle: "c1",
            ...updateData,
        });
    });

    test("not found if no such job", async function () {
        try {
            await Job.update(0, {
                title: "test",
            });
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });

    test("bad request with no data", async function () {
        try {
            await Job.update(testJobIds[0], {});
            fail();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});

/************************************** remove */

describe("remove", function () {
    test("works", async function () {
        await Job.remove(testJobIds[0]);
        const res = await db.query(
            "SELECT id FROM jobs WHERE id=$1", [testJobIds[0]]);
        expect(res.rows.length).toEqual(0);
    });

    test("not found if no such company", async function () {
        try {
            await Job.remove(99999);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});