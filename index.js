const dotenv = require("dotenv");
const puppeteer = require("puppeteer");
dotenv.config();

async function scrapeGradescope() {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto("https://www.gradescope.com/login");
    await page.screenshot({ path: "example.png" });
    // await page.waitForSelector("#session_email");
    await page.type("#session_email", process.env.GRADESCOPE_EMAIL);
    await page.screenshot({ path: "example1.png" });
    await page.waitForSelector("#session_password");
    await page.type("#session_password", process.env.GRADESCOPE_PASSWORD);
    await page.screenshot({ path: "example2.png" });
    await page.click("input[name='commit']");
    await page.screenshot({ path: "example3.png" });
    // await page.waitForNavigation();
    await page.waitForSelector("div.courseList--coursesForTerm");
    const children = await page.evaluate(() => {
        var elements = document.querySelectorAll(
            "div.courseList--term:first-of-type",
        )[0];
        elements = elements.nextSibling;
        elements = elements.children;
        console.error("sdf");
        // return elements.item(0).children;
        return Array.from(elements).map((e) => {
            return {
                href: e.href,
                element: e.children[0].textContent,
                className: e.children[0].textContent,
            };
        });
    });
    var courses = [];
    for (var i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.href !== undefined) {
            console.error(child.href);
            courses.push({
                href: child.href,
                el: child.element,
                className: child.className,
            });
        }
    }
    var assignments = [];
    for (const course of courses) {
        await page.goto(course.href);
        // var assigns = await page.$eval("button.js-submitAssignment", (e) => e);
        // console.error(assigns.textContent);
        // for (var i = 0; i < assigns.length; i++) {
        //     var name = assigns[i].textContent;
        //     console.error(name);
        // }
        var assigns = await page.evaluate(() => {
            var els = document.querySelectorAll("button.js-submitAssignment");
            return Array.from(els).map((e) => {
                return {
                    txt: e.textContent,
                    due: Date.parse(
                        e.parentNode.nextSibling.nextSibling.children[0].children[2].children[1].getAttribute(
                            "datetime",
                        ),
                    ),
                };
            });
        });
        assigns = assigns.map((e) => {
            return {
                name: e.txt,
                due: e.due / 1000,
                course: course.className,
            };
        });
        assignments = assignments.concat(assigns);
        // console.error(assigns);
        assigns = await page.evaluate(() => {
            var els = document.querySelectorAll("a");
            return Array.from(els)
                .filter(
                    (e) =>
                        e.getAttribute("aria-label") !== null &&
                        e.getAttribute("aria-label").includes("Submit"),
                )
                .map((e) => {
                    return {
                        txt: e.textContent,
                        due: Date.parse(
                            e.parentNode.nextSibling.nextSibling.childNodes[0].childNodes[2].childNodes[1].getAttribute(
                                "datetime",
                            ),
                        ),
                        // aria: e.getAttribute("aria-label"),
                    };
                });
        });
        assigns = assigns.map((e) => {
            return {
                name: e.txt,
                due: e.due / 1000,
                course: course.className,
            };
        });
        assignments = assignments.concat(assigns);

        // console.error(assigns);
        console.error(course.className);
    }
    console.log(JSON.stringify(assignments));
    // await page.screenshot({ path: "example4.png" });
    await browser.close();
}

scrapeGradescope().then(() => {
    console.error("Done");
});
