
import fetch from 'node-fetch';

const BASE_URL = 'http://www.sfu.ca/bin/wcm/course-outlines';

async function debugCourse(year, term, dept, number) {
    console.log(`Fetching ${dept} ${number} (${term} ${year})...`);

    try {
        const sectionsUrl = `${BASE_URL}?${year}/${term}/${dept}/${number}`;
        console.log(`GET ${sectionsUrl}`);

        const sectionsRes = await fetch(sectionsUrl);
        const sections = await sectionsRes.json();

        console.log(`Found ${sections.length} sections.`);

        for (const sec of sections) {
            const detailsUrl = `${BASE_URL}?${year}/${term}/${dept}/${number}/${sec.value}`;
            const detailsRes = await fetch(detailsUrl);
            const details = await detailsRes.json();

            console.log(`\nSection: ${sec.text} (value: ${sec.value})`);
            console.log(`  - type (info.type): ${details.info?.type}`);
            console.log(`  - sectionCode (info.sectionCode): ${details.info?.sectionCode}`);
            console.log(`  - associatedClass: ${details.info?.associatedClass}`); // Sometimes useful
            console.log(`  - designations: ${details.info?.designations}`);
        }
    } catch (e) {
        console.error(e);
    }
}

// Check CMPT 201 (or similar)
debugCourse('2025', 'spring', 'cmpt', '120');
// Also check CMPT 120 just to compare
// debugCourse('2025', 'spring', 'cmpt', '120');
