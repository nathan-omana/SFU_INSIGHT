
import fetch from 'node-fetch';

const BASE_URL = 'http://www.sfu.ca/bin/wcm/course-outlines';

async function debugCourse(year, term, dept, number) {
    console.log(`\n=== Fetching ${dept} ${number} ===`);
    try {
        const sectionsUrl = `${BASE_URL}?${year}/${term}/${dept}/${number}`;
        const sections = await (await fetch(sectionsUrl)).json();

        for (const sec of sections) {
            const details = await (await fetch(`${BASE_URL}?${year}/${term}/${dept}/${number}/${sec.value}`)).json();
            console.log(`${sec.text}: info.type='${details.info?.type}'`);
        }
    } catch (e) { console.error(e.message); }
}

async function run() {
    await debugCourse('2025', 'spring', 'cmpt', '120');
    await debugCourse('2025', 'spring', 'cmpt', '201');
}

run();
