/*$(document).ready(function(){
  var userID;
  var searchQry;
  var myPlaylistData;
  var baseURL;
  var myData;
  var theData;
  function playlist() {
    for (var i=0; i < 3; i = i + 1){
    $('#playlistLink' + i ).click(function(){
    $.ajax({
      type: "GET",
      url: "https://api.spotify.com/v1/users/" + userID + "/playlists",
      headers: {'Authorization': 'Bearer ' + access_token  },
      dataType: "json",
      data: "formdata",
      success: function (data) {
        myData = data.items[0].id;
        $('#playlistLink' + i ).click(function(){
          userID = document.getElementById('userID').innerHTML.toString();
          baseURL = "https://api.spotify.com/v1/users/" + userID + "/playlists/" + data.items[i].id;
          alert(baseURL);
        });
      }
      });
  });
};
};
$("#choosePlaylist").click(function(){
  userID = document.getElementById('userID').innerHTML.toString();
$.ajax({
  type: "GET",
  url: "https://api.spotify.com/v1/users/" + userID + "/playlists",
  headers: {'Authorization': 'Bearer ' + access_token  },
  dataType: "json",
  data: "formdata",
  success: function (data) {
    for (var i=0; i < data.items.length; i = i + 1){
    myData = data.items[0].id;
    $('#results').append("<li id='playlistLink" + i  + "'>"  + data.items[i].name + "</li>");
    $("li#playlistLink" + i).click(playlist);
  };
  }
  });
  });

});
*/
