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

export class WhoSampled {

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

      x(connectionsUrl, {
        songs: x('li.listEntry', [{
          sampleUrl: 'a@href'
        }])
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

  _sample(url) {
    return new Promise((resolve, reject) => {
      x(url, {
        title: '#sampleWrap_source .sampleTrackArtists',
        name: '#sampleWrap_source  .trackName',
        appearsAt: '.sampleTimingRight | parseTime | trim',
        youtubeId: '.sampleVideoRight iframe@src | parseYoutubeId'
      })((err, result) => {
        if (err) {
          reject(err); return;
        }
        resolve(result);
      })
    })
  }


}
