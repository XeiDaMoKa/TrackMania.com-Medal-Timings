// Custom Logs
const $$ = console.log;
const ALLtracks = $('.flex-grow-1 .col');


$('div.row.g-2.mb-2.row-cols-2.row-cols-sm-3.row-cols-md-4.row-cols-lg-5.row-cols-xl-6')
    .attr('class', 'row g-2 row-cols-2 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 row-cols-xl-5');

// Hide the element with class 'container mt-5 d-none d-xxl-block'
$('.container.mt-5.d-none.d-xxl-block').remove();

// Show the element with class 'container mt-5 d-block d-xxl-none'
$('.container.mt-5.d-block.d-xxl-none').attr('style', 'display: block !important');
let sortByTime = false;  // Initialize at the top of your script
let sortByPercent = false;  // Initialize at the top of your script
let originalOrder = null; // To store the original order of tracks
// Show the spinner and hide the buttons container
function showSpinnerHideButtons() {
    $('#ButtonsContainer').hide();
    $('.spinner').show();
  }

  // Hide the spinner and show the buttons container
  function hideSpinnerShowButtons() {
    $('#ButtonsContainer').show();
    $('.spinner').hide();
  }

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

const solvePERCENT = (rawTimeDiff, authorTime, useAbsolute = false) => {
    const [minAT, secAT] = authorTime.split(':').map(parseFloat);
    const timeATms = (minAT * 60 + secAT) * 1000;
    const effectiveRawTimeDiff = useAbsolute ? Math.abs(rawTimeDiff) : rawTimeDiff;
    return ((effectiveRawTimeDiff / timeATms) * 100).toFixed(2);
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
        // Check if the track is unreleased (no href)
        if (!trackHref) {
            trackElement.addClass("unreleased-track");
            resolve();
            return;  // Exit the function early
        }
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

                const { formatted: timeDifference, raw: rawTimeDiff } = solveTIME(timePB, authorTime);

                // Determine the track type
                let trackType = determineTrackType(timePB, rawTimeDiff);

                if (timePB === "--:--.---" || timePB === "00:00.000") {
                    timePB = "00:00.000";  // Use placeholder if no PB
                    trackType = "unfinished-track";
                }

                // Adding time and percent difference to the DOM
// Adding time and percent difference to the DOM
let displayTime = trackType === 'unfinished-track' ? authorTime : timeDifference;
let percentDifference = solvePERCENT(rawTimeDiff, authorTime);
let percentSymbol = '%';

if (trackType === "unfinished-track") {
    percentDifference = '-.--%';
    percentSymbol = '';
}
else if (trackType === "authored-track") {
    displayTime = `+${displayTime}`;
    percentDifference = `+${Math.abs(percentDifference)}`;
}
else if (trackType === "finished-track") {
    displayTime = `-${displayTime}`;
    percentDifference = `-${Math.abs(percentDifference)}`;
}

const timeDiv = $('<div>', {
    class: 'tm-map-card-totd-header time-div',
    text: `${displayTime}`
});
trackElement.find('.tm-map-card-totd-header').replaceWith(timeDiv);

const percentDiv = $('<div>', {
    class: 'tm-map-card-totd-header percent-div',
    text: `${percentDifference}${percentSymbol}`
});
percentDiv.insertAfter(trackElement.find('.tm-map-card-totd-header'));
                // Update the track type
                trackElement.addClass(trackType);
                resolve();
            });
    });
};



ALLtracks.each((index, element) => {
    const trackElement = $(element);
    const trackHref = trackElement.find('a.tm-map-card-totd-link').attr('href');
});

$('.flex-grow-1 .col').each((index, element) => {
    const trackElement = $(element);
    processToTDTrackElement(trackElement).then(() => {
    });
});
// Initialize variables to keep track of visibility
let hideUnfinished = false;
let hideAuthored = false;

function checkAndUnhide() {
    if (!sortByTime && !sortByPercent) {
        // Unhide tracks if both sorting toggles are off
        $('.col.unfinished-track, .col.authored-track').show();
        $('#hideUnfinishedBTN, #hideAuthoredBTN').removeClass('btn-secondary').addClass('btn-primary');
        hideUnfinished = false;
        hideAuthored = false;
    }
}
$('body').on('click', '#sortByTimeBTN', function() {
    $(this).toggleClass('btn-primary btn-secondary');
    sortByTime = !sortByTime;  // Toggle the state

    const trackContainer = $('div.row.g-2.row-cols-2.row-cols-sm-2.row-cols-md-3.row-cols-lg-4.row-cols-xl-5'); // Correct track container
    $('.unreleased-track').remove();

    if (sortByTime) {
        if (!originalOrder) {
            originalOrder = trackContainer.html(); // Save the original order


    }
        const sortedTracks = $('.col.finished-track, .col.authored-track, .col.unfinished-track').sort(function(a, b) {
            const trackA = $(a);
            const trackB = $(b);

            const timeStrA = trackA.find('.time-div').text().trim();
            const timeStrB = trackB.find('.time-div').text().trim();

            const timeA = parseFloat(timeStrA.replace(/[^0-9.-]/g, ''));
            const timeB = parseFloat(timeStrB.replace(/[^0-9.-]/g, ''));

            // Custom sorting logic
            const typeA = trackA.hasClass('unfinished-track') ? 0 : (trackA.hasClass('authored-track') ? 1 : 2);
            const typeB = trackB.hasClass('unfinished-track') ? 0 : (trackB.hasClass('authored-track') ? 1 : 2);

            if (typeA !== typeB) {
                return typeA - typeB;
            } else {
                if (typeA === 0 || typeA === 1) {
                    return timeB - timeA; // High to low
                } else {
                    return timeB - timeA; // Closest to zero to most negative
                }
            }
        });
    // Untoggle the Sort by Percent if it's active
    if (sortByPercent) {
        $('#sortByPercentBTN').toggleClass('btn-primary btn-secondary');
        sortByPercent = false;
    }
        trackContainer.html(sortedTracks);
    } else {
        if (originalOrder) {
            trackContainer.html(originalOrder);
        }
                checkAndUnhide();
    }
});




// Event Listener for Sort by % Button
$('body').on('click', '#sortByPercentBTN', function() {
    $(this).toggleClass('btn-primary btn-secondary');
    sortByPercent = !sortByPercent;  // Toggle the state

    const trackContainer = $('div.row.g-2.row-cols-2.row-cols-sm-2.row-cols-md-3.row-cols-lg-4.row-cols-xl-5'); // Correct track container
    $('.unreleased-track').remove();

    if (sortByPercent) {
        const sortedTracks = $('.col.finished-track, .col.authored-track, .col.unfinished-track').sort(function(a, b) {
            const percentStrA = $(a).find('.percent-div').text().trim();
            const percentStrB = $(b).find('.percent-div').text().trim();
            const timeStrA = $(a).find('.time-div').text().trim();
            const timeStrB = $(b).find('.time-div').text().trim();

            const percentA = parseFloat(percentStrA.replace(/[^0-9.-]/g, ''));
            const percentB = parseFloat(percentStrB.replace(/[^0-9.-]/g, ''));
            const timeA = parseFloat(timeStrA.replace(/[^0-9.-]/g, ''));
            const timeB = parseFloat(timeStrB.replace(/[^0-9.-]/g, ''));

            // Custom sorting logic
            const typeA = $(a).hasClass('unfinished-track') ? 0 : ($(a).hasClass('authored-track') ? 1 : 2);
            const typeB = $(b).hasClass('unfinished-track') ? 0 : ($(b).hasClass('authored-track') ? 1 : 2);

            if (typeA !== typeB) {
                return typeA - typeB;
            } else {
                if (typeA === 0) {
                    return timeB - timeA;  // Unfinished sorted by time, high to low
                } else if (typeA === 1) {
                    return percentB - percentA;  // Authored high to low
                } else {
                    return percentB - percentA;  // Finished closest to zero to most negative
                }
            }
        });
    // Untoggle the Sort by Time if it's active
    if (sortByTime) {
        $('#sortByTimeBTN').toggleClass('btn-primary btn-secondary');
        sortByTime = false;
    }
        trackContainer.html(sortedTracks);
    } else {
        if (originalOrder) {
            trackContainer.html(originalOrder);
        }
        checkAndUnhide(); // Check and unhide tracks if needed
    }
});


// Event Listener for Hide Unfinished Button
$('body').on('click', '#hideUnfinishedBTN', function() {
    $(this).toggleClass('btn-primary btn-secondary');
    hideUnfinished = !hideUnfinished;

    if (hideUnfinished) {
        $('.col.unfinished-track').hide();
    } else {
        $('.col.unfinished-track').show();
    }
});

// Event Listener for Hide Authored Button
$('body').on('click', '#hideAuthoredBTN', function() {
    $(this).toggleClass('btn-primary btn-secondary');
    hideAuthored = !hideAuthored;

    if (hideAuthored) {
        $('.col.authored-track').hide();
    } else {
        $('.col.authored-track').show();
    }
});







// Initialize variables at the top of your script
let originalContent = null;
let isAllTracks = false;

async function fetchAndPrependTracks(url = 'https://www.trackmania.com/track-of-the-day') {
    return new Promise(async (resolve, reject) => {
        showSpinnerHideButtons(); // Show spinner when function is first called
        try {
            const response = await fetch(url);
            const html = await response.text();
            const parser = new DOMParser();
            const fetchedDocument = parser.parseFromString(html, 'text/html');
            const fetchedTrackContainer = fetchedDocument.querySelector('.container.mt-5.d-block.d-xxl-none');
            const allFetchedCols = fetchedTrackContainer.querySelectorAll('.col');
            const trackContainer = $('div.row.g-2.row-cols-2.row-cols-sm-2.row-cols-md-3.row-cols-lg-4.row-cols-xl-5');

            const trackFetchPromises = [];

            for (const col of allFetchedCols) {
                if (col.querySelector('a.tm-map-card-totd-link[href]')) {
                    trackContainer.prepend(col);
                    const trackElement = $(col);
                    trackFetchPromises.push(processToTDTrackElement(trackElement));
                }
            }

            await Promise.all(trackFetchPromises);

            // Find the "Previous Month" button's URL for the next fetch.
            const prevMonthButton = fetchedDocument.querySelector('div.col-6.col-lg.order-2.order-lg-1.mt-3.mt-lg-0 a.tm-page-hero-control');

            // If the "Previous Month" button exists and has an href, fetch and append those tracks too.
            if (prevMonthButton && prevMonthButton.href) {
                await fetchAndPrependTracks(prevMonthButton.href);
            }

            resolve();
        } catch (err) {
            console.error("Fetch error:", err);
            reject(err);
        }
    }).finally(() => {
        hideSpinnerShowButtons(); // Hide spinner once all fetching and processing are done
    });
}




// Event Listener for "All Daily Tracks" Button
$('body').on('click', '#allTracksBTN', function() {
    console.log("Button clicked, current state of isAllTracks:", isAllTracks);

    const parentContainer = $('div.container.mt-5.d-block.d-xxl-none'); // Parent container
    const trackContainer = parentContainer.find('div.row.g-2.row-cols-2.row-cols-sm-2.row-cols-md-3.row-cols-lg-4.row-cols-xl-5');

if (!originalContent) {
    originalContent = trackContainer.clone();  // Clone the original content
    originalContent.find('.unreleased-track').remove();  // Remove unreleased tracks
}


    $(this).toggleClass('btn-primary btn-secondary'); // Toggle button

    if (isAllTracks) {
        // Revert to original daily tracks
        console.log("Reverting to daily tracks");
        trackContainer.replaceWith(originalContent.clone());  // Use a clone to keep the original intact
        isAllTracks = false; // Toggle state
    } else {
        // Replace with an empty div of the same class
        console.log("Replacing with an empty div");
        trackContainer.replaceWith('<div class="row g-2 row-cols-2 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 row-cols-xl-5"></div>');
        isAllTracks = true; // Toggle state
        fetchAndPrependTracks();
    }

});
