// console log with $$
const $$ = function(...args) {
    for (let arg of args) {
        if (arg instanceof jQuery) {
            console.log(`${arg.length} Tracks Found`);
        } else {
            console.log(arg);
        }
    }
};
// Find Tracks
const OCtracks = $('.container.mt-5.d-block.d-xxl-none .col');
$$(OCtracks);
const COTDtracks = $('.container.my-2 .col.p-1');
$$(COTDtracks);
const ALLtracks = OCtracks.add(COTDtracks);

// Append Buttons
fetch(chrome.runtime.getURL("content.html"))
    .then(response => response.text())
    .then(content => {
        $('.tm-page-hero.container.py-3.py-lg-5').append(content);
        $$("Buttons Appended");
    });

// Fetch URL of All Tracks
ALLtracks.each(function() {
    const trackElement = $(this);
    const trackHref = trackElement.find('a').attr('href');
    $$(`Fetching HREF`);

    // Fetch Content of URL
    fetch(trackHref)
        .then(response => response.text())
        .then(html => {
            const trackPage = $(html);

            // Get Medals List
            const medalsList = trackPage.find('.list-unstyled.tm-map-score');

            // Create Medals List DIV, Append Medals List to DIV and Append DIV to IMG
            const medalsDiv = $('<div>', {
                class: 'tm-map-card-official-footer medals-div'
            });
            medalsDiv.append(medalsList);
            trackElement.find('a.tm-map-card-official-link img').after(medalsDiv);

            // Get PB, Assign Custom Class & Append to Footer
            const personalBest = trackPage.find('p.tm-map-score').addClass('personal-best');
            trackElement.find('.tm-map-card-official-footer.d-flex.flex-column > div').eq(1).html(personalBest);

            // Extract the PB time and Author time.
            let timePB = personalBest.text().trim().split("\n").pop().trim();
            if (timePB === "--:--.---") {
                timePB = "00:00.000";
            }
            const authorTime = medalsList.find('li').first().text().trim().split("\n").pop().trim();

            // Compute the time difference.
            const solveTIME = (time1, time2) => {
                const [minutes1, seconds1] = time1.split(':').map(parseFloat);
                const [minutes2, seconds2] = time2.split(':').map(parseFloat);
                const rawDiffInSeconds = (minutes1 * 60 + seconds1) - (minutes2 * 60 + seconds2);
                const absoluteDiffInSeconds = Math.abs(rawDiffInSeconds);
                const diffMinutes = Math.floor(absoluteDiffInSeconds / 60);
                const diffSeconds = (absoluteDiffInSeconds % 60).toFixed(3);

                let prefix = "";
                if (rawDiffInSeconds > 0 || time1 === "00:00.000") {
                    prefix = "-";
                } else {
                    prefix = "+";
                }

                return {
                    formatted: `${prefix}${diffMinutes.toString().padStart(2, '0')}:${diffSeconds.padStart(6, '0')}`,
                    raw: rawDiffInSeconds
                };
            };

            const { formatted: timeDifference, raw: rawTimeDiff } = solveTIME(timePB, authorTime);

            // Create the timeDIV & replace the Track Number with it
            const timeDiv = $('<div>', {
                class: 'tm-map-card-official-header time-div',
                text: `${timeDifference}`
            });
            trackElement.find('.tm-map-card-official .tm-map-card-official-header').replaceWith(timeDiv);

            // Compute the percentage difference
            const solvePERCENT = (rawDiff, authorTime) => {
                const [minutesPercent, secondsPercent] = authorTime.split(':').map(parseFloat);
                const totalTimeInSeconds = minutesPercent * 60 + secondsPercent;

                if (timePB === "00:00.000") {
                    return "-.--%";
                }

                const percentDifference = (rawDiff / totalTimeInSeconds) * 100;
                let prefix = rawDiff >= 0 ? "-" : "+";
                return `${prefix}${Math.abs(percentDifference).toFixed(2)}%`;
            };

            const percentDifference = solvePERCENT(rawTimeDiff, authorTime);

            // Create the percent-div & append after the time div
            const percentDiv = $('<div>', {
                class: 'tm-map-card-official-header percent-div',
                text: `${percentDifference}`
            });
            percentDiv.insertAfter(trackElement.find('.tm-map-card-official .time-div'));

            // Function to determine track type and return corresponding class
            const determineTrackType = (timePB, rawTimeDiff) => {
                if (timePB === "00:00.000") {
                    return 'unfinished-track';
                } else if (rawTimeDiff > 0) {
                    return 'finished-track';
                } else {
                    return 'authored-track';
                }
            };
            $$(`Info Appended`);
            // Determine the track type and add the appropriate class
            const trackType = determineTrackType(timePB, rawTimeDiff);
            trackElement.addClass(trackType);


// Store the original content immediately
const origTracksDIV = $('.row.g-2.row-cols-2.row-cols-sm-2.row-cols-md-3.row-cols-lg-4.row-cols-xl-5').clone();

// Toggle button class
$('#allTracksBTN').off('click').on('click', function() {
    $(this).toggleClass('btn-primary btn-secondary');

    if ($(this).hasClass('btn-secondary')) {
        $.get('https://www.trackmania.com/campaigns', function(data) {
            $$(`fetching`);
            var fetchedPage = $(data);
            var fetchedTracks = fetchedPage.find('.col.p-1');
            $$(`Fetched`);

            // Replace the original div with fetched tracks and give it a unique ID
            const allTracksDIV = $('<div>', {
                class: 'row g-2 row-cols-2 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 row-cols-xl-5',
                id: 'fetchedTracksContainer'
            }).append(fetchedTracks);
            $('.row.g-2.row-cols-2.row-cols-sm-2.row-cols-md-3.row-cols-lg-4.row-cols-xl-5').replaceWith(allTracksDIV);
            $$(`Old Tracks Replaced with New Tracks`);
        });
    } else {
        // When toggled off (show original content)
        $('#fetchedTracksContainer').replaceWith(origTracksDIV);
        $$(`Reverted to Original Tracks`);
    }
});



        });

});
