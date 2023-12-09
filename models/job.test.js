"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
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
        equity: 0,
        company_handle: "c1"
    };

    test("works", async function () {
        let job = await Job.create(newJob);
        expect(job).toEqual(newJob);

        const result = await db.query(
            `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE title = 'New'`);
        expect(result.rows).toEqual([
            {
                id: 4,
                title: "New",
                salary: 99000,
                equity: 0,
                company_handle: "c1"
            },
        ]);
    });
});

/************************************** findJobs */

describe("findJobs", function () {
    test("works: no filter", async function () {
        let companies = await Job.findJobs();
        expect(companies).toEqual([
            {
                id: 1,
                title: 'j1',
                salary: 50000,
                equity: 0,
                company_handle: 'c1'
            },
            {
                id: 2,
                title: 'j2',
                salary: 129000,
                equity: 0.025,
                company_handle: 'c2'
            },
            {
                id: 3,
                title: 'j3',
                salary: 249000,
                equity: 0.099,
                company_handle: 'c3'
            },
        ]);
    });
});

/************************************** update */

describe("update", function () {
    const updateData = {
        title: "New",
        salary: 109000,
        equity: 0
    };

    test("works", async function () {
        let job = await Job.update(1, updateData);
        expect(job).toEqual({
            id: 1,
            ...updateData,
        });

        const result = await db.query(
            `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = 1`);
        expect(result.rows).toEqual([{
            id: 1,
            title: "New",
            salary: 109000,
            equity: 0,
            company_handle: "c1"

        }]);
    });

    test("works: null fields", async function () {
        const updateDataSetNulls = {
            title: "New Title",
            salary: null,
            equity: null
        };

        let job = await Job.update(1, updateDataSetNulls);
        expect(job).toEqual({
            id: 1,
            ...updateDataSetNulls,
        });

        const result = await db.query(
            `SELECT handle, name, description, num_employees, logo_url
           FROM companies
           WHERE handle = 'c1'`);
        expect(result.rows).toEqual([{
            id: 1,
            title: "New Title",
            salary: null,
            equity: null,
            company_handle: "c1"
        }]);
    });

    test("not found if no such job", async function () {
        try {
            await Job.update(99999, updateData);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });

    test("bad request with no data", async function () {
        try {
            await Job.update(1, {});
            fail();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});

/************************************** remove */

describe("remove", function () {
    test("works", async function () {
        await Job.remove(1);
        const res = await db.query(
            "SELECT id FROM jobs WHERE id='c1'");
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