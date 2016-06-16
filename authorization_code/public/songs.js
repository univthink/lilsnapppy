$(document).ready(function(){

  var userID;
  var baseURL;
  var myData;
  var searchQry;
  var trackID;
  var playlists;
  var playlists = [];
  var total;
  var totalVariable;
  var jsonData;
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
      playlist = myData.items[0].id;
      $.ajax({
        type: "GET",
        url: "https://api.spotify.com/v1/search?q=" + searchQry + "&type=track,artist&market=us&limit=50&offset=0",
        headers: {'Authorization': 'Bearer ' + access_token  },
        dataType: "json",
        data: "formdata",
        success: function (data) {
        alert("Success2");
        for (var i=0; i < data.tracks.items.length; i++){
        $('#results').append("<a class='songLink'>" + data.tracks.items[i].artists[0].name + " ////////// " + data.tracks.items[i].name + "</a><br/>");
        $(".songLink").eq(i).attr("id", "songLink" + i );
        $(".songLink").eq(i).attr("name", baseURL  + userID + "/playlists/" + "4FTFDr6pe2OIl84yIjjWYF" + "/tracks?position=0&uris=spotify%3Atrack%3A" + data.tracks.items[i].id);
        var list = $(' #results ').children(' a ');
        /*$('#results > a').each(function() {
          $(this).prependTo(this.parentNode);
        });*/
        $('#songLink' + i).on( "click", function(){
          $.ajax({
            type: "POST",
            url: $( this ).attr('name'),
            headers: {'Authorization': 'Bearer ' + access_token  },
            dataType: "json",
            data: "formdata",
            success: function (dataFirst) {
              alert($( this ).attr('name'));
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
