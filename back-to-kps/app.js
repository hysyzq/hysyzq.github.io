async function initMap() {
    var communityCenter = { lat: -33.706276551341325,   lng: 150.94656745195007 }; // Your community coordinates
    var map = new google.maps.Map(document.getElementById("map"), {
        zoom: 17, // Higher zoom level for better building details
        center: communityCenter,
        mapTypeId: 'roadmap' // 'roadmap', 'satellite', 'hybrid', etc.
    });

    try {
        const houses = await fetchHouseDataFromGoogleSheets();
        houses.forEach(function(house) {
            var marker = new google.maps.Marker({
                position: { lat: parseFloat(house.latitude), lng: parseFloat(house.longitude) },
                map: map,
                title: "House " + house.id
            });

            marker.addListener('click', function() {
                openPanelWithHouseData(house);
            });
        });
    } catch (error) {
        console.error("Error fetching house data:", error);
    }
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
        const [id, latitude, longitude,street_number,street_name] = rows[i];
        houses.push({
            id: id,
            latitude: latitude,
            longitude: longitude,
            street_number: street_number,
            street_name: street_name
        });
    }

    return houses;
}

function openPanelWithHouseData(house) {
    // Displaying form with the details of the clicked house
    const formPanel = document.getElementById('formPanel');
    formPanel.innerHTML = `
        <h3>Address: ${house.street_number}  ${house.street_name}</h3>
        <form>
            <label for="checkbox1">Checkbox 1</label>
            <input type="checkbox" id="checkbox1">
            <br>
            <label for="input1">Input 1</label>
            <input type="text" id="input1">
            <br><br>
            <button type="submit">Submit</button>
        </form>
        <button onclick="closePanel()">Close</button>
    `;
}

function closePanel() {
    const formPanel = document.getElementById('formPanel');
    formPanel.innerHTML = '';
}
