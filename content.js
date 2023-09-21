const $$ = function(...args) {
    for (let arg of args) {
        if (arg instanceof jQuery) {
            console.log(`${arg.length} Tracks Found`);
        } else {
            console.log(arg);
        }
    }
};

// Append Buttons
fetch(chrome.runtime.getURL("content.html"))
    .then(response => response.text())
    .then(content => {
        $('.tm-page-hero.container.py-3.py-lg-5').append(content);
        $$("Buttons Appended");
    });

const processTrackElement = function(trackElement) {
    const trackHref = trackElement.find('a').attr('href');
    $$(`Fetching HREF`);
    fetch(trackHref)
        .then(response => response.text())
        .then(html => {
            const trackPage = $(html);
            const medalsList = trackPage.find('.list-unstyled.tm-map-score');
            const medalsDiv = $('<div>', {
                class: 'tm-map-card-official-footer medals-div'
            });
            medalsDiv.append(medalsList);
            trackElement.find('a.tm-map-card-official-link img').after(medalsDiv);
            const personalBest = trackPage.find('p.tm-map-score').addClass('personal-best');
            trackElement.find('.tm-map-card-official-footer.d-flex.flex-column > div').eq(1).html(personalBest);
            let timePB = personalBest.text().trim().split("\n").pop().trim();
            if (timePB === "--:--.---") {
                timePB = "00:00.000";
            }
            const authorTime = medalsList.find('li').first().text().trim().split("\n").pop().trim();
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
            const timeDiv = $('<div>', {
                class: 'tm-map-card-official-header time-div',
                text: `${timeDifference}`
            });
            trackElement.find('.tm-map-card-official .tm-map-card-official-header').replaceWith(timeDiv);
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
            const percentDiv = $('<div>', {
                class: 'tm-map-card-official-header percent-div',
                text: `${percentDifference}`
            });
            percentDiv.insertAfter(trackElement.find('.tm-map-card-official .time-div'));
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
            $$(`Info Appended`);
        });
};

const OCtracks = $('.container.mt-5.d-block.d-xxl-none .col');
$$(OCtracks);
const COTDtracks = $('.container.my-2 .col.p-1');
$$(COTDtracks);
const ALLtracks = OCtracks.add(COTDtracks);

ALLtracks.each(function() {
    processTrackElement($(this));
});

// Store the originals AFTER they have been processed
const origTracksDIV = $('.row.g-2.row-cols-2.row-cols-sm-2.row-cols-md-3.row-cols-lg-4.row-cols-xl-5').clone();
$$(`original tracks stored`);

$('body').on('click', '#allTracksBTN', function() {
    $(this).toggleClass('btn-primary btn-secondary');
    $$(`button class toggled`);
    if ($(this).hasClass('btn-secondary')) {
        $.get('https://www.trackmania.com/campaigns', function(data) {
            $$(`fetching`);
            const fetchedPage = $(data);
            const fetchedTracks = fetchedPage.find('.col.p-1');
            $$(`Fetched`);
            const allTracksDIV = $('<div>', {
                class: 'row g-2 row-cols-2 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 row-cols-xl-5',
                id: 'fetchedTracksContainer'
            }).append(fetchedTracks);
            $('.row.g-2.row-cols-2.row-cols-sm-2.row-cols-md-3.row-cols-lg-4.row-cols-xl-5').replaceWith(allTracksDIV);
            fetchedTracks.each(function() {
                processTrackElement($(this));
            });
            $$(`Old Tracks Replaced with New Tracks`);
        });
    } else {
        $('#fetchedTracksContainer').replaceWith(origTracksDIV);
        $$(`Reverted to Original Tracks`);
    }
});