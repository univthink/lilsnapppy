$(document).ready(function(){

  var userID;
  var baseURL;
  var myData;
  var searchQry;
  var trackID;
  var Snapster;
  var playlists = [];
  var total;
  var totalVariable;
  var jsonData;
  var obj;
  var flag;
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
      $('#setDefaultPlaylist').on( "click", function(){
      for (var i = 0; i < myData.items.length; i++) {
      obj = myData.items[i].name;
      if (obj == "Snapster") {
          Snapster = myData.items[i].id;
          flag = 1;
      }
      else if(flag != 1) {
          alert("Please create a playlist called 'Snapster'");
          }
      }
      console.log(Snapster);
    });
        $.ajax({
        type: "GET",
        url: "https://api.spotify.com/v1/search?q=" + searchQry + "&type=track,artist&market=us&limit=50&offset=0",
        headers: {'Authorization': 'Bearer ' + access_token  },
        dataType: "json",
        data: "formdata",
        success: function (data) {
        for (var i=0; i < data.tracks.items.length; i++){
        if(Snapster == obj){
           Snapster = myData.items[i].id;
        }
        else {
          console.log("No Snapster");
        }
        $('#results').append("<a class='songLink'>" + data.tracks.items[i].artists[0].name + " ////////// " + data.tracks.items[i].name + "</a><br/>");
        $(".songLink").eq(i).attr("id", "songLink" + i );
        $(".songLink").eq(i).attr("name", baseURL  + userID + "/playlists/" + Snapster + "/tracks?position=0&uris=spotify%3Atrack%3A" + data.tracks.items[i].id);
        var list = $(' #results ').children(' a ');
        $('#songLink' + i).on( "click", function(){
          $.ajax({
            type: "POST",
            url: $( this ).attr('name'),
            headers: {'Authorization': 'Bearer ' + access_token  },
            dataType: "json",
            data: "formdata",
            success: function (dataFirst) {
              console.log(Snapster);
            }
             });
             });
             };

           }

   });


   }


   });
   });
   });
