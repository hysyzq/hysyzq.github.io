async function initMap() {
    var communityCenter = { lat: -33.706276551341325,   lng: 150.94656745195007 }; // Your community coordinates
    var map = new google.maps.Map(document.getElementById("map"), {
        zoom: 17, // Higher zoom level for better building details
        center: communityCenter,
        mapId: '7b8e1c8edc768e27',
        mapTypeId: 'roadmap' // 'roadmap', 'satellite', 'hybrid', etc.
    });

    try {
        const houses = await fetchHouseDataFromGoogleSheets();
        const responses = await fetchFormResponseDataFromGoogleSheets();

        responses.forEach(function(response) {
            const matchingHouse = houses.find(house =>
                house.street_number === response.street_number &&
                house.street_name === response.street_name
            );
            
            if (matchingHouse) {

                const adjustedLongitude = parseFloat(matchingHouse.longitude) + (matchingHouse.picked * 0.00002);

                const marker = new google.maps.marker.AdvancedMarkerElement({
                    position: { lat: parseFloat(matchingHouse.latitude), lng: adjustedLongitude },
                    map: map,
                    title: `${matchingHouse.street_number} ${matchingHouse.street_name}`,
                    content: createMarkerContent(response)
                });

                marker.addListener('click', function() {
                    openPanelWithResponseData(response);
                });
                matchingHouse.picked += 1;
            }
        });

        houses.forEach(function(house) {
            if (!house.picked) {
                const marker = new google.maps.marker.AdvancedMarkerElement({
                    position: { lat: parseFloat(house.latitude), lng: parseFloat(house.longitude) },
                    map: map,
                    title: `${house.street_number} ${house.street_name}`,
                    content: createMarkerContent(house)
                });

                marker.addListener('click', function() {
                    openGoogleForm(house);
                });
            }
        });

    } catch (error) {
        console.error("Error fetching house data:", error);
    }
}

function createMarkerContent(response) {
    let pinColor;
    let borderColor;
    let scale;
    switch (response.support_level) {
        case 4:
            pinColor = '#52b788'; // Green
            borderColor = '#081c15';
            scale = 1.0;
            break;
        case 3:
            pinColor = '#00b4d8'; // Blue
            borderColor = '#0077b6';
            scale = 1.0;
            break;
        case 2:
            pinColor = '#e63946'; // Red
            borderColor = '#9d0208';
            scale = 1.0;
            break;
        case 1:
            pinColor = '#495057'; // Grey
            borderColor = '#343a40';
            scale = 0.7;
            break;
        default:
            pinColor = '#fefae0'; // Default
            borderColor = '#dda15e';
            scale = 0.7;
    }
    const pinBackground = new google.maps.marker.PinElement({
        scale: scale,
        background: pinColor,
        borderColor: borderColor,
        //glyph: "G",
        glyphColor: "white",
      });
    return pinBackground.element;
}


async function fetchHouseDataFromGoogleSheets() {
    const spreadsheetId = '1KKfRYIl4uh7N0HtxBT5EVGDKfZCXLJi81HNPNLkj-LY';
    const apiKey = 'AIzaSyBS-QIHhKKCmhg8Lz54cwxNeWW-DXHYOzM'; 
    const range = 'houses!A:E';

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`;
    
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Failed to fetch Google Sheets data');
    }
    const data = await response.json();
    
    // Transform the data from the Google Sheet to the required format
    const rows = data.values;
    const houses = [];
    
    // Assuming the first row is headers, start from the second row
    for (let i = 1; i < rows.length; i++) {
        const [id, latitude, longitude,street_number,street_name, status] = rows[i];
        houses.push({
            id: id,
            latitude: latitude,
            longitude: longitude,
            street_number: street_number,
            street_name: street_name,
            picked: 0,
        });
    }

    return houses;
}

async function fetchFormResponseDataFromGoogleSheets() {
    const spreadsheetId = '1KKfRYIl4uh7N0HtxBT5EVGDKfZCXLJi81HNPNLkj-LY';
    const apiKey = 'AIzaSyBS-QIHhKKCmhg8Lz54cwxNeWW-DXHYOzM'; 
    const range = 'MaskedData!A:K';

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`;
    
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Failed to fetch Google Sheets data');
    }
    const data = await response.json();
    
    // Transform the data from the Google Sheet to the required format
    const rows = data.values;
    const responses = [];
    
    // Assuming the first row is headers, start from the second row
    for (let i = 1; i < rows.length; i++) {
        const [timestamp, preferred_name, email, street_number, street_name, support_community, main_concerns,petition, phone_number, availability, comments] = rows[i];
        responses.push({
            timestamp: timestamp,
            preferred_name: preferred_name,
            email: email,
            street_number: street_number,
            street_name: street_name,
            support_community: support_community,
            main_concerns: main_concerns,
            petition: petition,
            phone_number: phone_number,
            availability: availability,
            comments: comments,
            support_level: getSupportLevel(support_community),
        });
    }

    return responses;
}

function getSupportLevel(support_community){
    switch (support_community) {
        case 'Yes, through volunteering.':
            return 4;
        case 'Yes, but I only want to participate in the most important meetings.':
            return 3;
        case 'I am interested, but I need more information.':
            return 2
        case 'No, not at this time.':
            return 1;
        default:
            return 0;
    }
}

function openPanelWithResponseData(response) {
    // Displaying form with the details of the clicked response
    const formPanel = document.getElementById('formPanel');
    formPanel.innerHTML = `
        <h3>Address: ${response.street_number} ${response.street_name}</h3>
        <p><strong>Preferred Name:</strong> ${response.preferred_name}</p>
        <p><strong>Email:</strong> ${response.email}</p>
        <p><strong>Support Community:</strong> ${response.support_community}</p>
        <p><strong>Main Concerns:</strong> ${response.main_concerns}</p>
        <p><strong>Petition signed:</strong> ${response.petition}</p>
        <p><strong>Phone number:</strong> ${response.phone_number}</p>
        <p><strong>Availability:</strong> ${response.availability ? response.availability : 'N/A'}</p>
        <p><strong>Comments:</strong> ${response.comments ? response.comments : 'N/A'}</p>
        <button onclick="closePanel()">Close</button>
    `;
}


function openGoogleForm() {
    // Display Google Form link in the panel
    const formPanel = document.getElementById('formPanel');
    formPanel.innerHTML = `
        <h3>Submit Your Information</h3>
        <p>Please fill out the form to provide more information about your household.</p>
        <a href="https://docs.google.com/forms/d/e/1FAIpQLSd9RBuwM5OJFsknA77ag35fo8iFY1HEXMjw78E-9vQeHb4A1g/viewform?usp=sf_link" target="_blank">Open Google Form</a>
        <button onclick="closePanel()">Close</button>
    `;
}

function closePanel() {
    const formPanel = document.getElementById('formPanel');
    formPanel.innerHTML = `<h3>House Information</h3>
            <p>Welcome to the community form collection app! Here's what the markers on the map represent:</p>
            <ul>
                <li><span style="color: #52b788; font-weight: bold;">Green:</span> Actively supports the community through volunteering.</li>
                <li><span style="color: #00b4d8; font-weight: bold;">Blue:</span> Interested in participating in important meetings only.</li>
                <li><span style="color: #495057; font-weight: bold;">Gray:</span> Not currently interested in participating.</li>
                <li><span style="color: #e63946; font-weight: bold;">Red:</span> Interested but needs more information.</li>
                <li><span style="color: #ead875; font-weight: bold;">Yellow:</span> No response recorded yet. Please click and fill the form.</li>
            </ul>
            <p>Click on a marker to see more details or submit your information via the Google Form.</p>`;
}
