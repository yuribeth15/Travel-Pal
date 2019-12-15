// Initialize app
var myApp = new Framework7();


// If we need to use custom DOM library, let's save it to $$ variable:
var $$ = Dom7;

// Add view
var mainView = myApp.addView('.view-main', {
    // Because we want to use dynamic navbar, we need to enable it for this view:
    dynamicNavbar: true
});

// Handle Cordova Device Ready Event
$$(document).on('deviceready', function() {
    console.log("Device is ready!");
});


// Now we need to run the code that will be executed only for About page.

// Option 1. Using page callback for page (for "about" page in this case) (recommended way):
myApp.onPageInit('about', function (page) {
    // Do something here for "about" page

})

// Option 2. Using one 'pageInit' event handler for all pages:
$$(document).on('pageInit', function (e) {
    // Get page data from event data
    var page = e.detail.page;

    if (page.name === 'about') {
        // Following code will be executed for page with data-page attribute equal to "about"
        myApp.alert('Here comes About page');
    }
})

// Option 2. Using live 'pageInit' event handlers for each page
$$(document).on('pageInit', '.page[data-page="about"]', function (e) {
    // Following code will be executed for page with data-page attribute equal to "about"
    myApp.alert('Here comes About page');
})

//This are global variable in order to access to them later on, in the code
var lat = null;
var long = null;
var safeGeoInfotmation;
var saveWeatherInformation;

//requesting access to the file system
function tryingFile(){

    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, fileSystemCallback, onError);
   
}

//callback function that allow me to call the above function when ready 
function fileSystemCallback(fs){

    // Name of the file I want to create
    var fileToCreate = "SaveApiInfo.txt";

    // Opening/creating the file
    fs.root.getFile(fileToCreate, fileSystemOptionals, getFileCallback, onError);
}

var fileSystemOptionals = { create: true, exclusive: false };

//Another callback function with an argument 
function getFileCallback(fileEntry){

    // this variable store the contect I want to write and read
    var dataObj = new Blob([safeGeoInfotmation,saveWeatherInformation], { type: 'text/plain' });

    // Writing to the file
    writeFile(fileEntry, dataObj);

    // Reading the file
    readFile(fileEntry);
}


function writeFile(fileEntry, dataObj) {

    // Create a FileWriter object for our FileEntry.
    fileEntry.createWriter(function (fileWriter) {

        // If data object is not passed in,
        // create a new Blob instead.

        if (!dataObj) {
            dataObj = new Blob([text], { type: 'text/plain' });
        }

        fileWriter.write(dataObj);

        fileWriter.onwriteend = function() {
            console.log("Successful file write");
        };

        fileWriter.onerror = function (e) {
            alert("Failed to Save");
            console.log("Failed file write: " + e.toString());
        };

    });
}

function readFile(fileEntry) {

    // Get the file from the file entry
    fileEntry.file(function (file) {
        
        // Create the reader
        var reader = new FileReader();
        reader.readAsText(file);

        reader.onloadend = function() {

            console.log("Successful File Read: " + this.result);
            alert("You have saved the following information: \n\n" + this.result);
            console.log("file path: " + fileEntry.fullPath);

        };

    }, onError);
}

//function provided by phonegap to access to GPS sensor
function getCurrentLocation(){
    navigator.geolocation.getCurrentPosition(geoCallback, onError);
}

//this callback function takes as a parameter position object
//to extract data from this object I initialazed the lat and long variables 
//with the lat,long and timestamp of the position object
function geoCallback(position){ 
    console.log(position);

    lat = position.coords.latitude;
    long = position.coords.longitude;
    const key = '81b15433026a494b9e4a760bfee1fcd1'; //API key to be ble to access to its data
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${lat},${long}&key=${key}`;

                 fetch(url)
                 .then(res => res.json())
                 .then(post => {
                     console.log(post);
    
    //once the information from the API is fetch I can extract specific information from it 
    var coordinates ='Welcome To '+ post.results[0].components.country +' '+ post.results[0].components.city;
    var localTime ='The Local Date and Time is: <br> ' + post.timestamp.created_http;
    var localCurrency = ' The Local Currency is: <br> ' + post.results[0].annotations.currency.symbol + 
                        ' - ' + post.results[0].annotations.currency.name;
    
    var fileSystemInfo ='Your are in ' + post.results[0].components.country + '-' + post.results[0].components.city  +
                     ' The Local Date and Time is: ' + post.timestamp.created_http + ' The Local Currency is: '+ 
                      post.results[0].annotations.currency.name;

    //information that goes in the side panel
    var county = post.results[0].components.state;
    document.getElementById('county').innerHTML = county;
    var extraInfo = " <h4>Your Full Address is: </h4>"+ post.results[0].formatted +
                    " <h4>International coding code: </h4>" + post.results[0].annotations.callingcode + 
                    " <h4>PostCode: </h4>"+ post.results[0].components.postcode +
                    " <h4>You Drive on: </h4>"+ post.results[0].annotations.roadinfo.drive_on +
                    " <h4>The speed is: </h4>" + post.results[0].annotations.roadinfo.speed_in  
    document.getElementById('extra').innerHTML = extraInfo;


    // I used this method to return the element with same ID refering to the HTLM element
    // and showing this information to the browers
    document.getElementById('location').innerHTML = coordinates;
    document.getElementById('date').innerHTML = localTime;
    document.getElementById('local-currency').innerHTML = localCurrency;

    // this variable is global and is storing this local variables that wil be use in the getFileCallback funtion 
    safeGeoInfotmation = fileSystemInfo;

    /*****This part is to show the google maps******/ 

    //using the variable from the position object of the geolocation 
    //I create this object with latitude and longitude
    var myLatLng = {
        lat: lat, 
        lng: long
    };
    
    //Here we set two options : the zoom and the center of the map
    var map = new google.maps.Map(document.getElementById('map'), {
     zoom: 8,
     center: myLatLng
    
    });
    
    //using a marker to show the location information gather by the GPS sensor
    var marker = new google.maps.Marker({
     position: myLatLng,
     map:map,
     title:'Google Maps'
    });
    
    });
}


// an error callback funtion
function onError(msg){
    console.log(msg);
}

//this function takes two parameters latitud and longitude gather from the previous function
//and now I re-use it in this function in order to get current weather regarding to current location
function weatherApi(lat, long){

    lat = this.lat;
    long = this.long;
    
    const key = 'cd43db7b63a62290b42397ed7ca21113';
    const unit = 'metric';
    const url = ` http://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${long}&appid=${key}&units=${unit}`;
    
                 fetch(url)
                 .then(res => res.json())
                 .then(post => {
                     console.log(post);

                     //Once API information is fecth I can extract the necessary information for this purpose
                     weatherDisplay = "Temperature: " + parseInt(post.main.temp) + " <di>&deg; </div>C" + " with " + post.weather[0].description ; 
                     document.getElementById('temp').innerHTML = weatherDisplay;
                     description = "It Feels Like: " + parseInt(post.main.feels_like);
                     document.getElementById('description').innerHTML = description;
                     humidity = "Humidity: " + post.main.humidity + "%";
                     document.getElementById('humidity').innerHTML = humidity;
                     minTemp = "Mininum temperature: " + post.main.temp_min + " <di>&deg; </div>C";
                     document.getElementById('min').innerHTML = minTemp;
                     maxTemp = "Maxinum temperature: " + parseInt(post.main.temp_max) + " <di>&deg; </div>C";
                     document.getElementById('max').innerHTML = maxTemp;

                     saveWeatherInformation = " The Local Temperature is: " + parseInt(post.main.temp) + " *C";
    
            });
    
    
    }

//function for getting information from the currency API to convert currencies
    function currencyAPI(){
        var key = '1373ef9c1e2ebf6f01bcfa007d77cbd5';
        var url = `http://data.fixer.io/api/latest?access_key=${key}&format =1`
        
                    fetch(url)
                    .then(res => res.json())
                    .then(post => {
                        
        // let displayDate = "Today's Date is: " + post.date;
        // document.getElementById('date').innerHTML = displayDate;
        
        //this variables gets the id element from the html file for each of the currencies 
        const usDollar = document.getElementById('usdinput');
        const euro = document.getElementById('eurosOutput');
        const pound = document.getElementById('PoundOutput');
        const swissFranc = document.getElementById('CHFOutput');
    
        // this are objects, and each of them have all the possible combinations 
        // of converting dollars, euros, pound and swiss franc 
        var convertionFromUSD = {
    
             dollarToEuro: post.rates.EUR / post.rates.USD,
             dollarToPound: post.rates.GBP / post.rates.USD,
             dollarToswissFranc: post.rates.CHF / post.rates.USD,
    
        }
    
        var convertionFromEuro = {
    
            euroToDollar: post.rates.USD / post.rates.EUR,
            euroToPound: post.rates.GBP / post.rates.EUR,
            euroToswissFranc: post.rates.CHF / post.rates.EUR,
    
       }
    
       var convertionFromPound = {
    
        poundToDollar: post.rates.USD / post.rates.GBP,
        poundToEuro: post.rates.EUR / post.rates.GBP,
        poundToswissFranc: post.rates.CHF / post.rates.GBP,
    
    }
    
        var convertionFromswissFranc = {
    
        swissFrancToDollar: post.rates.USD / post.rates.CHF,
        swissFrancToEuro: post.rates.EUR / post.rates.CHF,
        swissFrancToPound: post.rates.GBP / post.rates.CHF,
    
    }
    
            //using each of the variables that are calling the html element  and listenning for an input 
            //passing a function that will tell the browser to convert the actual currency if there is an input
            // Each of this function will get the user's input and therefore from one currency do the convertion 
            //by usng the currency's object data previously created.

            usDollar.addEventListener('input',function(e){
            const fromUSD = parseFloat(usDollar.value);
            const toEuro = (fromUSD * convertionFromUSD.dollarToEuro).toFixed(2); // setting the answer to only two decimal palces
            const toPound = (fromUSD * convertionFromUSD.dollarToPound).toFixed(2);
            const toswissFranc = (fromUSD * convertionFromUSD.dollarToswissFranc).toFixed(2);
            // here it allows me to show the value of the input on each of its fields with the respectively convertion 
            euro.value = toEuro;
            pound.value = toPound;
            swissFranc.value = toswissFranc;
    
        }); 
    
        euro.addEventListener('input',function(e){
            const fromEur = parseFloat(euro.value);
            const toUsd = (fromEur * convertionFromEuro.euroToDollar ).toFixed(2);
            const toPound = (fromEur * convertionFromEuro.euroToPound ).toFixed(2);
            const toswissFranc = (fromEur * convertionFromEuro.euroToswissFranc).toFixed(2);
            usDollar.value = toUsd;
            pound.value = toPound;
            swissFranc.value = toswissFranc;
        });
    
        pound.addEventListener('input',function(e){
            const fromPound = parseFloat(pound.value);
            const toUsd = (fromPound * convertionFromPound.poundToDollar).toFixed(2);
            const toEuro = (fromPound * convertionFromPound.poundToEuro ).toFixed(2);
            const toswissFranc = (fromPound * convertionFromPound.poundToswissFranc).toFixed(2);
            usDollar.value = toUsd;
            euro.value = toEuro;
            swissFranc.value = toswissFranc;
        })
    
        swissFranc.addEventListener('input',function(e){
            const fromSwissFranc = parseFloat(swissFranc.value);
            const toUsd = (fromSwissFranc * convertionFromswissFranc.swissFrancToDollar ).toFixed(2);
            const toEuro = (fromSwissFranc * convertionFromswissFranc.swissFrancToEuro ).toFixed(2);
            const toPound = (fromSwissFranc * convertionFromswissFranc.swissFrancToPound).toFixed(2);
            usDollar.value = toUsd;
            euro.value = toEuro;
            pound.value = toPound;
        })
       
        });
    
    }

    

//calling the functions for current location and currencies
getCurrentLocation();
currencyAPI();