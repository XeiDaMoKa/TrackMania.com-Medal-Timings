// step 1
// Custom Logs
const $$ = console.dir;
const ALLtracks = $('.flex-grow-1 .col');
let sortByTime = false;
let sortByPercent = false;
let lastStateBeforeSort; // To store the last state before any sort
let processingOriginals = true;

//Step 2
// Append Buttons
fetch(chrome.runtime.getURL("content.html"))
    .then(response => response.text())
    .then(content => {
        $('.tm-page-hero.container.py-3.py-lg-5').append(content);
        $('#ButtonsContainer').hide();
        $('.spinner').show();
        initiateTrackProcessing();
    });

const processTrackElement = function(trackElement) {
    return new Promise((resolve, reject) => {

    const trackHref = trackElement.find('a').attr('href');
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
            let timePB = personalBest.text().trim().split("\\n").pop().trim();
            if (timePB === "--:--.---") {
                timePB = "00:00.000";
            }
            const authorTime = medalsList.find('li').first().text().trim().split("\\n").pop().trim();
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

            // If we are processing the original tracks, clone them
            if (processingOriginals) {
                origTracksDIV = $('.row.g-2.row-cols-2.row-cols-sm-2.row-cols-md-3.row-cols-lg-4.row-cols-xl-5').clone();
            }
            resolve();
        });
    });
};

    function initiateTrackProcessing() {
        // An array to hold all the promises
        const promises = [];

        // Process each track element
        ALLtracks.each(function(index, element) {
            const promise = processTrackElement($(this));
            promises.push(promise);
        });

        // Wait for all promises to resolve, then hide the spinner and show the buttons
        Promise.all(promises).then(() => {
            $('.spinner').hide();
            $('#ButtonsContainer').show();
        });
    }

// Step 5
// New Function to Fetch and Append Tracks
// Modified fetchAndAppendTracks function
let allProcessPromises = [];  // Array to hold all track processing promises

const fetchAndAppendTracks = (url) => {
    return new Promise((resolve, reject) => {
        $.get(url, function(data) {
            const fetchedPage = $(data);
            const fetchedTracks = fetchedPage.find('.col.p-1');

            // Create a temporary div to hold the fetched tracks
            const tempDiv = $('<div>');

            // Add fetched tracks to temporary div
            tempDiv.append(fetchedTracks);

            // Process each track and then move it to the main container
            fetchedTracks.each(function() {
                const processPromise = processTrackElement($(this)).then(() => {
                    // Move this track from the temporary div to the main container
                    $('#fetchedTracksContainer').prepend($(this));
                });
                allProcessPromises.push(processPromise);
            });

            // Check for a link to the previous season
            const prevSeasonLink = fetchedPage.find('div.col-6.col-lg.order-2.order-lg-1.mt-3.mt-lg-0 a').attr('href');
            if (prevSeasonLink) {
                // Fetch and append those tracks too
                fetchAndAppendTracks(prevSeasonLink).then(resolve).catch(reject);
            } else {
                // If no link is found, we are done
                resolve();
            }
        });
    });
};

$('body').on('click', '#allTracksBTN', async function() {
    $(this).toggleClass('btn-primary btn-secondary');

    if ($(this).hasClass('btn-secondary')) {
        processingOriginals = false;  // Set the flag to false as we are fetching new tracks now

        // Show spinner
        $('#ButtonsContainer').hide();
        $('.spinner').show();

        // Your existing code to replace the original tracks container and fetch new tracks
        const newTracksDiv = $('<div>', {
            class: 'row g-2 row-cols-2 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 row-cols-xl-5',
            id: 'fetchedTracksContainer'
        });
        $('.row.g-2.row-cols-2.row-cols-sm-2.row-cols-md-3.row-cols-lg-4.row-cols-xl-5').replaceWith(newTracksDiv);

        // Fetch and append tracks to the new container
        await fetchAndAppendTracks('https://www.trackmania.com/campaigns');
    // Wait for all track processing to complete
    await Promise.all(allProcessPromises);
        // Hide spinner and show buttons
        $('.spinner').hide();
        $('#ButtonsContainer').show();
    } else {
        // Revert to original tracks
        $('#fetchedTracksContainer').replaceWith(origTracksDIV);
        $('#ButtonsContainer').show();
    }
});



// New Functionality: Event Listener for Hide Unfinished Tracks Button
let hideUnfinished = false; // Flag to keep track of the toggle state

$('body').on('click', '#hideUnfinishedBTN', function() {
    $(this).toggleClass('btn-primary btn-secondary');
    hideUnfinished = !hideUnfinished; // Toggle the state

    // Toggle the visibility of tracks with the class 'unfinished-track'
    if (hideUnfinished) {
        $('.unfinished-track').hide();
    } else {
        $('.unfinished-track').show();
    }
});


// New Functionality: Event Listener for Hide Authored Tracks Button
let hideAuthored = false; // Flag to keep track of the toggle state

$('body').on('click', '#hideAuthoredBTN', function() {
    $(this).toggleClass('btn-primary btn-secondary');
    hideAuthored = !hideAuthored; // Toggle the state

    // Toggle the visibility of tracks with the class 'authored-track'
    if (hideAuthored) {
        $('.authored-track').hide();
    } else {
        $('.authored-track').show();
    }
});


// Event Listener for Sort by Time Button
$('body').on('click', '#sortByTimeBTN', function() {
    $(this).toggleClass('btn-primary btn-secondary');
    sortByTime = !sortByTime; // Toggle the state
    sortByPercent = false; // Deactivate sort by percent
    $('#sortByPercentBTN').addClass('btn-primary').removeClass('btn-secondary');

    const trackContainer = $('.row.g-2.row-cols-2.row-cols-sm-2.row-cols-md-3.row-cols-lg-4.row-cols-xl-5');

    if (sortByTime) {
        lastStateBeforeSort = trackContainer.children().clone(); // Store the current state

        // Sorting logic here for time-div
        const sortedTracks = $('.col.p-1').sort(function(a, b) {
            const trackA = $(a);
            const trackB = $(b);

            const timeStrA = trackA.find('.time-div').text().trim();
            const timeStrB = trackB.find('.time-div').text().trim();

            // Convert time strings to numerical values for comparison
            const timeA = parseFloat(timeStrA.replace(/[^0-9.-]/g, '')) * (timeStrA.startsWith('-') ? 1 : -1);
            const timeB = parseFloat(timeStrB.replace(/[^0-9.-]/g, '')) * (timeStrB.startsWith('-') ? 1 : -1);

            if (trackA.hasClass('unfinished-track') && trackB.hasClass('unfinished-track')) {
                return timeA - timeB; // Ascending in terms of arithmetic value, but effectively from most negative to least negative
            }
            if (trackA.hasClass('unfinished-track')) {
                return -1;
            }
            if (trackB.hasClass('unfinished-track')) {
                return 1;
            }

            if (trackA.hasClass('authored-track') && trackB.hasClass('authored-track')) {
                return timeA - timeB; // Ascending
            }
            if (trackA.hasClass('authored-track')) {
                return -1;
            }
            if (trackB.hasClass('authored-track')) {
                return 1;
            }

            // For finished-track, which is the default case
            return timeB - timeA; // Ascending
        });

        trackContainer.html(sortedTracks);
    } else {
        // Revert to the last state before sort
        trackContainer.html(lastStateBeforeSort);
                // Untoggle Hide Unfinished and Hide Authored
        $('#hideUnfinishedBTN').removeClass('btn-secondary').addClass('btn-primary');
        $('#hideAuthoredBTN').removeClass('btn-secondary').addClass('btn-primary');
        $('.unfinished-track').show();
        $('.authored-track').show();
    }
});



// Event Listener for Sort by Percent Button
$('body').on('click', '#sortByPercentBTN', function() {
    $(this).toggleClass('btn-primary btn-secondary');
    sortByPercent = !sortByPercent;  // Toggle the state
    sortByTime = false; // Deactivate sort by time
    $('#sortByTimeBTN').addClass('btn-primary').removeClass('btn-secondary');

    const trackContainer = $('.row.g-2.row-cols-2.row-cols-sm-2.row-cols-md-3.row-cols-lg-4.row-cols-xl-5');

    if (sortByPercent) {
        lastStateBeforeSort = trackContainer.children().clone(); // Store the current state

        const sortedTracks = $('.col.p-1').sort(function(a, b) {
            const trackA = $(a);
            const trackB = $(b);

            const percentA = parseFloat(trackA.find('.percent-div').text().replace('%', ''));
            const percentB = parseFloat(trackB.find('.percent-div').text().replace('%', ''));

            if (trackA.hasClass('unfinished-track') && trackB.hasClass('unfinished-track')) {
                const timeStrA = trackA.find('.time-div').text().trim();
                const timeStrB = trackB.find('.time-div').text().trim();
                const timeA = parseFloat(timeStrA.replace(/[^0-9.-]/g, '')) * (timeStrA.startsWith('-') ? 1 : -1);
                const timeB = parseFloat(timeStrB.replace(/[^0-9.-]/g, '')) * (timeStrB.startsWith('-') ? 1 : -1);
                return timeA - timeB; // Ascending based on time
            }

            if (trackA.hasClass('unfinished-track')) {
                return -1;
            }
            if (trackB.hasClass('unfinished-track')) {
                return 1;
            }

            if (trackA.hasClass('authored-track') && trackB.hasClass('authored-track')) {
                return percentB - percentA; // Reverse Ascending
            }
            if (trackA.hasClass('authored-track')) {
                return -1;
            }
            if (trackB.hasClass('authored-track')) {
                return 1;
            }

            // For finished-track, which is the default case
            return percentB - percentA; // Reverse Ascending
        });

        trackContainer.html(sortedTracks);
    } else {
        // Revert to the last state before sort
        trackContainer.html(lastStateBeforeSort);
                // Untoggle Hide Unfinished and Hide Authored
                $('#hideUnfinishedBTN').removeClass('btn-secondary').addClass('btn-primary');
                $('#hideAuthoredBTN').removeClass('btn-secondary').addClass('btn-primary');
                $('.unfinished-track').show();
                $('.authored-track').show();
    }
});