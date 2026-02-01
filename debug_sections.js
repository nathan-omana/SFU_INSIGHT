
import fetch from 'node-fetch';

const BASE_URL = 'http://www.sfu.ca/bin/wcm/course-outlines';

async function listAllSections(year, term, dept, number) {
    console.log(`\n=== Listing all sections for ${dept} ${number} ===`);
    try {
        const url = `${BASE_URL}?${year}/${term}/${dept}/${number}`;
        const sections = await (await fetch(url)).json();

        console.log(`Total sections found: ${sections.length}`);
        sections.forEach(s => console.log(s.text));

    } catch (e) { console.error(e.message); }
}

listAllSections('2025', 'spring', 'cmpt', '120');
