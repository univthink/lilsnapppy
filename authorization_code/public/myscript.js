
$(document).ready(function(){




$("#searchSongs").click(function(){
  var searchQry = document.getElementById('filename').value;
  var userID = document.getElementById('userID').innerHTML;

  $.ajax({
    type: "GET",
    url: "https://api.spotify.com/v1/search?q=" + searchQry + "&type=track,artist&market=us&limit=10&offset=5",
    headers: {'Authorization': 'Bearer ' + access_token  },
    dataType: "json",
    data: "formdata",
    success: function (data) {
      $.each(data.tracks, function() {
      document.getElementById('results').innerHTML = "<a class='link'>" + data.tracks.items[0].name + "</a>";
    });
      $(".link").click(function(){
        $.ajax({
          type: "POST",
          url: "https://api.spotify.com/v1/users/" + userID + "/playlists" + "/7xiz00lH5aNxmiAqR9Iibl/" + "tracks?position=1&uris=spotify%3Atrack%3A" + data.tracks.items[0].id,
          headers: {'Authorization': 'Bearer ' + access_token  },
          success: function () {alert("Success!");},

      });
        });
    }
});
  });
  });


  $(document).ready(function(){

  $("#addSong").click(function(){
    $.ajax({
      type: "POST",
      url: "https://api.spotify.com/v1/users/" + "b.univthink" + "/playlists" + "/7xiz00lH5aNxmiAqR9Iibl/" + "tracks?position=1&uris=spotify%3Atrack%3A" + "12VWzyPDBCc8fqeWCAfNwR",
      headers: {'Authorization': 'Bearer ' + access_token  },
      success: function () {alert("HI!");},

  });
    });
    });





  /* find template and compile it
  var templateSource = document.getElementById('results-template').innerHTML,
      template = Handlebars.compile(templateSource),
      resultsPlaceholder = document.getElementById('results'),
      playingCssClass = 'playing',
      audioObject = null;

  var fetchTracks = function (trackId, callback) {
      $.ajax({
          url: 'https://api.spotify.com/v1/search?q=/tracks' + trackId,
          success: function (response) {
              resultsPlaceholder.innerHTML = template(response);
          }
      });
  };

  var searchTracks = function (query) {
      $.ajax({
          url: 'https://api.spotify.com/v1/search',
          data: {
              q: query,
              type: 'track'
          },
          success: function (response) {
              resultsPlaceholder.innerHTML = template(response);
          }
      });
  };
*/
/*results[1].addEventListener('click', function (e) {
      var target = e.target;
      if (target !== null && target.classList.contains('cover')) {
          if (target.classList.contains(playingCssClass)) {
              audioObject.pause();
          } else {
              if (audioObject) {
                  audioObject.pause();
              }
              fetchTracks(target.getAttribute('data-album-id'), function (data) {
                  audioObject = new Audio(data.tracks.items[0].preview_url);
                  audioObject.play();
                  target.classList.add(playingCssClass);
                  audioObject.addEventListener('ended', function () {
                      target.classList.remove(playingCssClass);
                  });
                  audioObject.addEventListener('pause', function () {
                      target.classList.remove(playingCssClass);
                  });
              });
          }
      }
  });

  document.getElementById('search-form').addEventListener('submit', function (e) {
      e.preventDefault();
      searchTracks(document.getElementById('query').value);
  }, false);
*/
