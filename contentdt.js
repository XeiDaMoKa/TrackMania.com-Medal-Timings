// Custom Logs
const $$ = console.log;
const ALLtracks = $('.flex-grow-1 .col:visible');


$('div.row.g-2.mb-2.row-cols-2.row-cols-sm-3.row-cols-md-4.row-cols-lg-5.row-cols-xl-6')
    .attr('class', 'row g-2 row-cols-2 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 row-cols-xl-5');

// Hide the element with class 'container mt-5 d-none d-xxl-block'
$('.container.mt-5.d-none.d-xxl-block').attr('style', 'display: none !important');

// Show the element with class 'container mt-5 d-block d-xxl-none'
$('.container.mt-5.d-block.d-xxl-none').attr('style', 'display: block !important');

// Rest of your initial code
fetch(chrome.runtime.getURL("contentdt.html"))
    .then(response => response.text())
    .then(content => {
        $('.tm-page-hero.container.py-3.py-lg-5').append(content);
    });

// Utility Functions
const solveTIME = (timePB, authorTime) => {
    // Convert these times to milliseconds for easier comparison
    const [minPB, secPB] = timePB.split(':').map(parseFloat);
    const [minAT, secAT] = authorTime.split(':').map(parseFloat);
    const timePBms = (minPB * 60 + secPB) * 1000;
    const timeATms = (minAT * 60 + secAT) * 1000;

    const rawTimeDiff = timePBms - timeATms;
    const absoluteDiffInSeconds = Math.abs(rawTimeDiff / 1000);
    const diffMinutes = Math.floor(absoluteDiffInSeconds / 60);
    const diffSeconds = (absoluteDiffInSeconds % 60).toFixed(3);

    const formattedTimeDiff = `${diffMinutes.toString().padStart(2, '0')}:${diffSeconds.padStart(6, '0')}`;
    return { formatted: formattedTimeDiff, raw: rawTimeDiff };
};

const solvePERCENT = (rawTimeDiff, authorTime) => {
    const [minAT, secAT] = authorTime.split(':').map(parseFloat);
    const timeATms = (minAT * 60 + secAT) * 1000;
    return ((rawTimeDiff / timeATms) * 100).toFixed(2);
};

const determineTrackType = (timePB, rawTimeDiff) => {
    if (timePB === "00:00.000") return "unfinished-track";
    if (rawTimeDiff > 0) return "finished-track";
    return "authored-track";
};
const processToTDTrackElement = function(trackElement) {
    return new Promise((resolve, reject) => {
        const trackHref = trackElement.find('a.tm-map-card-totd-link').attr('href');
        fetch(trackHref)
            .then(response => response.text())
            .then(html => {
                const trackPage = $(html);

                // Fetching medals and appending them
                const medalsList = trackPage.find('.list-unstyled.tm-map-score');
                const medalsDiv = $('<div>', {
                    class: 'tm-map-card-totd-footer medals-div'
                });
                medalsDiv.append(medalsList);
                trackElement.find('a.tm-map-card-totd-link').append(medalsDiv);

                // Fetching personal best time and appending it
                const personalBest = trackPage.find('p.tm-map-score').addClass('personal-best');
                trackElement.find('.tm-text-long a').html(personalBest);

        // Calculate time and percent difference
        let timePB = personalBest.text().trim().split("\\n").pop().trim();
        const authorTime = medalsList.find('li').first().text().trim().split("\\n").pop().trim();

        if (timePB === "--:--.---" || timePB === "00:00.000") {
            timePB = authorTime; // Use author time if no PB
        }

        const { formatted: timeDifference, raw: rawTimeDiff } = solveTIME(timePB, authorTime);


                const timeDiv = $('<div>', {
                    class: 'tm-map-card-totd-header time-div',
                    text: `${timeDifference}`
                });
                trackElement.find('.tm-map-card-totd-header').replaceWith(timeDiv);

                const percentDifference = solvePERCENT(rawTimeDiff, authorTime);
                const percentDiv = $('<div>', {
                    class: 'tm-map-card-totd-header percent-div',
                    text: `${percentDifference}`
                });
                percentDiv.insertAfter(trackElement.find('.tm-map-card-totd-header'));

// Determine the type of track and set the appropriate classes and colors
const determineTrackType = (timePB, rawTimeDiff) => {
    if (timePB === "00:00.000") {
        return 'unfinished-track';
    } else if (rawTimeDiff > 0) {
        return 'finished-track';
    } else {
        return 'authored-track';
    }
};

const trackType = determineTrackType(timePB, rawTimeDiff);
trackElement.addClass(trackType);

// Now, adjust the time based on track type
if (trackType === 'unfinished-track') {
    timeDiv.text(authorTime); // Set the time to author time
}


                resolve();
            });
    });
};

ALLtracks.each((index, element) => {
    const trackElement = $(element);
    const trackHref = trackElement.find('a.tm-map-card-totd-link').attr('href');
    $$("Track HREF:", trackHref);
});

$('.flex-grow-1 .col').each((index, element) => {
    const trackElement = $(element);
    processToTDTrackElement(trackElement).then(() => {
        console.log('Processed ToTD track element');
    });
});
