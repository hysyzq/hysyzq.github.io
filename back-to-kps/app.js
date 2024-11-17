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
                matchingHouse.picked = true;
                const marker = new google.maps.marker.AdvancedMarkerElement({
                    position: { lat: parseFloat(matchingHouse.latitude), lng: parseFloat(matchingHouse.longitude) },
                    map: map,
                    title: `${matchingHouse.street_number} ${matchingHouse.street_name}`,
                    content: createMarkerContent(response)
                });

                marker.addListener('click', function() {
                    openPanelWithResponseData(response);
                });
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
    switch (response.support_community) {
        case 'Yes, through volunteering.':
            pinColor = '#52b788'; // Green
            borderColor = '#081c15';
            scale = 1.0;
            break;
        case 'Yes, but I only want to participate in the most important meetings.':
            pinColor = '#00b4d8'; // Blue
            borderColor = '#0077b6';
            scale = 1.0;
            break;
        case 'No, not at this time.':
            pinColor = '#495057'; // Grey
            borderColor = '#343a40';
            scale = 0.7;
            break;
        case 'I am interested, but I need more information.':
            pinColor = '#e63946'; // Red
            borderColor = '#9d0208';
            scale = 1.0;
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
            picked: false,
        });
    }

    return houses;
}

async function fetchFormResponseDataFromGoogleSheets() {
    const spreadsheetId = '1KKfRYIl4uh7N0HtxBT5EVGDKfZCXLJi81HNPNLkj-LY';
    const apiKey = 'AIzaSyBS-QIHhKKCmhg8Lz54cwxNeWW-DXHYOzM'; 
    const range = 'FormResponse!A:J';

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
        const [timestamp, preferred_name, email, street_number, street_name, support_community, main_concerns, phone_number, availability, comments] = rows[i];
        responses.push({
            timestamp: timestamp,
            preferred_name: preferred_name,
            email: email,
            street_number: street_number,
            street_name: street_name,
            support_community: support_community,
            main_concerns: main_concerns,
            phone_number: phone_number,
            availability: availability,
            comments: comments,
        });
    }

    return responses;
}

function openPanelWithResponseData(response) {
    // Displaying form with the details of the clicked response
    const formPanel = document.getElementById('formPanel');
    formPanel.innerHTML = `
        <h3>Address: ${response.street_number} ${response.street_name}</h3>
        <p><strong>Preferred Name:</strong> ${response.preferred_name}</p>
        <p><strong>Email:</strong> ${response.email.substring(0, 3)}***${response.email.substring(response.email.length - 10)}</p>
        <p><strong>Support Community:</strong> ${response.support_community}</p>
        <p><strong>Main Concerns:</strong> ${response.main_concerns}</p>
        <p><strong>Phone number provided:</strong> ${response.phone_number ? '✅' : '❌'}</p>
        <p><strong>Availability:</strong> ${response.availability}</p>
        <p><strong>Comments:</strong> ${response.comments}</p>
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
    formPanel.innerHTML = '';
}
