import Xray from 'x-ray';

const x = Xray({
  filters: {
    trim: (value) => {
      return typeof value === 'string' ? value.trim() : value
    },
    parseYoutubeId: (value) => {
      if (value && typeof value === 'string') {
        if (value.match(/youtube/)) {
          return value.split('embed/')[1].split('?')[0]
        }
      }
      return false;
    },
    parseTime: (value) => {
      if (value && typeof value === 'string') {
        return value.split('at')[1].split('(and')[0]
      }
      return false;
    }

  }
});

class WhoSampled {

  constructor() {
    this.rootUrl = 'http://www.whosampled.com/search';
  }

  samples({q = '', limit = null} = {}) {
    return new Promise((resolve, reject) => {

      if (!q) {
        reject('Please supply a query'); return;
      }

      q = encodeURIComponent(q)

      const connectionsUrl = `${this.rootUrl}/connections/?q=${q}`;
      
      console.log(connectionsUrl)

      x(connectionsUrl, {
        songs: x('li.listEntry', [{ sampleUrl: 'a@href' }])
      })((err, result) => {
        if (err) { reject(err); return; }

        if (limit) {
          result.songs = result.songs.slice(0, limit);
        }

        const samples = result.songs.map((item) => {
          return this._sample(item.sampleUrl)
        });

        resolve(
          Promise.all(samples).then((values) => {
            return values
          })
        );
      })
    })
  }
  
  _sourceTrackNames(tracks) {
    return tracks.map((track) => {
      return track.source.name
    });
  }

  _sample(url) {
    return new Promise((resolve, reject) => {
      x(url, {
        dest: {
          artist: '#sampleWrap_dest .sampleTrackArtists | trim',
          name: '#sampleWrap_dest  .trackName | trim',
          appearsAt: '.sampleTimingRight | parseTime | trim',
          youtubeId: '.sampleVideoRight iframe@src | parseYoutubeId'
        },
        source: {
          artist: '#sampleWrap_source .sampleTrackArtists | trim',
          name: '#sampleWrap_source  .trackName | trim',
          appearsAt: '.layout-container.leftContent > section > div:nth-child(3) > div.sampleTimings.sample-layout-row .sampleTimingRight | parseTime | trim',
          youtubeId: '.layout-container.leftContent > section > div:nth-child(3) .sampleVideoRight iframe@src | parseYoutubeId'
        }
      })((err, result) => {
        if (err) {
          reject(err); return;
        }
        resolve(result);
      })
    })
  }

  distance(s1, s2) {
    if (typeof(s1) != "string" || typeof(s2) != "string") return 0;
    if (s1.length == 0 || s2.length == 0) 
      return 0;
    s1 = s1.toLowerCase(), s2 = s2.toLowerCase();
    var matchWindow = (Math.floor(Math.max(s1.length, s2.length) / 2.0)) - 1;
    var matches1 = new Array(s1.length);
    var matches2 = new Array(s2.length);
    var m = 0; // number of matches
    var t = 0; // number of transpositions

    //debug helpers
    //console.log("s1: " + s1 + "; s2: " + s2);
    //console.log(" - matchWindow: " + matchWindow);

    // find matches
    for (var i = 0; i < s1.length; i++) {
      var matched = false;

      // check for an exact match
      if (s1[i] ==  s2[i]) {
	matches1[i] = matches2[i] = matched = true;
	m++
      }

      // check the "match window"
      else {
        // this for loop is a little brutal
        for (k = (i <= matchWindow) ? 0 : i - matchWindow;
             (k <= i + matchWindow) && k < s2.length && !matched;
	     k++) {
          if (s1[i] == s2[k]) {
            if(!matches1[i] && !matches2[k]) {
              m++;
            }

            matches1[i] = matches2[k] = matched = true;
          }
        }
      }
    }

    if(m == 0)
      return 0.0;

    // count transpositions
    var k = 0;

    for(var i = 0; i < s1.length; i++) {
      if(matches1[k]) {
    	while(!matches2[k] && k < matches2.length)
          k++;
	if(s1[i] != s2[k] &&  k < matches2.length)  {
          t++;
        }

    	k++;
      }
    }
    
    //debug helpers:
    //console.log(" - matches: " + m);
    //console.log(" - transpositions: " + t);
    t = t / 2.0;
    return (m / s1.length + m / s2.length + (m - t) / m) / 3;
  }

  // Computes the Winkler distance between two string -- intrepreted from:
  // http://en.wikipedia.org/wiki/Jaro%E2%80%93Winkler_distance
  // s1 is the first string to compare
  // s2 is the second string to compare
  // dj is the Jaro Distance (if you've already computed it), leave blank and the method handles it
  jaroWinklerDistance(s1, s2, dj) {
    if (s1 == s2) {
      return 1 
    }
    else {
      var jaro;
      (typeof(dj) == 'undefined')? jaro = this.distance(s1,s2) : jaro = dj;
      var p = 0.1; //
      var l = 0 // length of the matching prefix
      while(s1[l] == s2[l] && l < 4)
	l++;
      
      return jaro + l * p * (1 - jaro);
    }
  }
}

module.exports = WhoSampled
