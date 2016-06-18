$(document).ready(function(){
  var userID;
  var baseURL;
  var myData;
  var searchQry;
  var trackID;
  var sendInfo;
  var Snapster;
  var playlists = [];
  var total;
  var totalVariable;
  var jsonData;
  var obj;
  var flag;
    $("#test").click(function () {
        searchQry = document.getElementById('filename').value;
        userID = document.getElementById('userID').innerHTML; 
        $.ajax({
            type: "GET",
            url: "https://api.spotify.com/v1/users/" + userID + "/playlists",
            headers: { 'Authorization': 'Bearer ' + access_token },
            dataType: "json",
            data: "formdata",
            success: function (myData) {
                alert("success");
            }
        });
    });
    /*
    $('#setDefaultPlaylist').on("click", function () {
        searchQry = document.getElementById('filename').value;
        userID = document.getElementById('userID').innerHTML; 
        $.ajax({
            type: "GET",
            url: "https://api.spotify.com/v1/users/" + userID + "/playlists",
            headers: { 'Authorization': 'Bearer ' + access_token },
            dataType: "json",
            data: "formdata",
            success: function (myData) {
                
                if ("Snapster" in myData.items) {
                    console.log(Snapster);
                }
                else {
                    sendInfo = { "name": "Snapster", "public": true, };
                    $.ajax({
                        type: "POST",
                        url: "https://api.spotify.com/v1/users/" + userID + "/playlists",
                        headers: { 'Authorization': 'Bearer ' + access_token },
                        dataType: "application/json",
                        data: JSON.stringify(sendInfo),
                        success: function (dataFirst) {
                            console.log(Snapster);
                            alert("Please create a playlist called 'Snapster'");
                            Snapster = myData.items[i].id;
                        }

                    });
                }
                    
            }
        });   */
      
$("#searchSongs").click(function(){
  searchQry = document.getElementById('filename').value;
  userID = document.getElementById('userID').innerHTML;
  baseURL = "https://api.spotify.com/v1/users/";
  $('#results').empty();

  $.ajax({
    type: "GET",
    url: "https://api.spotify.com/v1/users/" + userID + "/playlists",
    headers: {'Authorization': 'Bearer ' + access_token  },
    dataType: "json",
    data: "formdata",
    success: function (myData) {
                for (i = 0; i < myData.items.length; i++) {
              
                        if ("Snapster" in myData.items[i]) {
                            Snapster = myData.items[i].id;
                       
                        
                        console.log(Snapster);

                    }
                    else {
                        sendInfo = { "name": "Snapster", "public": true, };
                        $.ajax({
                            type: "POST",
                            url: "https://api.spotify.com/v1/users/" + userID + "/playlists",
                            headers: { 'Authorization': 'Bearer ' + access_token },
                            dataType: "application/json",
                            data: JSON.stringify(sendInfo),
                            success: function (dataFirst) {
                                console.log(Snapster);
                                alert("Please create a playlist called 'Snapster'");
                                for (i = 0; i < myData.items.length; i++) {
                                    if ("Snapster" in myData.items[i]) {
                                        Snapster = myData.items[i].id;
                                    }
                                }
                            }

                        });
                    }
                }
                    
            
 


    }
        });
        $.ajax({
            type: "GET",
            url: "https://api.spotify.com/v1/search?q=" + searchQry + "&type=track,artist&market=us&limit=50&offset=0",
            headers: { 'Authorization': 'Bearer ' + access_token },
            dataType: "json",
            data: "formdata",
            success: function (data) {
                for (var i = 0; i < data.tracks.items.length; i++) {
                    $('#results').append("<header class='songLink'>" + data.tracks.items[i].artists[0].name + " ////////// " + data.tracks.items[i].name + "</header><br/>");
                    $(".songLink").eq(i).attr("id", "songLink" + i);
                    $(".songLink").eq(i).attr("name", baseURL + userID + "/playlists/" + Snapster + "/tracks?position=0&uris=spotify%3Atrack%3A" + data.tracks.items[i].id);
                    var list = $(' #results ').children(' a ');
                    $('#songLink' + i).on("click", function () {
                        $.ajax({
                            type: "POST",
                            url: $(this).attr('name'),
                            headers: { 'Authorization': 'Bearer ' + access_token },
                            dataType: "json",
                            data: "formdata",
                            success: function (dataFirst) {
                                console.log(Snapster);
                            }
                        });
                        $('#results').empty();
                    });
                };
                console.log(Snapster);



            }


        });

    });
    });
