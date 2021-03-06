import {expect} from 'chai';
import WhoSampled from '../';
const {describe, it} = global;
const whosamp = new WhoSampled();

describe('WhoSampled', () => {
  it('should be initialized', () => {
    expect(whosamp.init()).to.equal("initialized");
  });

  describe('connections', () => {
    it('should return if no query is provided', () => {
      whosamp.connections({q: null}).catch((result) => {
        expect(result).to.equal("Please supply a query")
      })
      whosamp.connections().catch((result) => {
        expect(result).to.equal("Please supply a query")
      })
    })

    it('returns a single sample', async () => {
      const sampleUrl = "http://www.whosampled.com/sample/24/Kanye-West-Jamie-Foxx-Gold-Digger-Ray-Charles-I-Got-a-Woman/";
      const result = await whosamp.sample(sampleUrl)
    })

    it.only('returns all samples', async () => {
      const result = await whosamp.samples({q: 'marvin gaye grapevine', limit: 10});
      console.log(result)
      
      const printTrackNames = (type, tracks) => {
        return tracks.map((track) => {
          if (type === 'dest') {
            return track.dest.artist + ' - ' + track.dest.name
          } else if (type === 'source') {
            return track.source.artist + ' - ' + track.source.name
          }
          return false;
        })
      }
      // console.log(whosamp._sourceTrackNames(result))
      console.log(printTrackNames('source', result))
      
      // console.log(whosamp.jaroWinklerDistance('keni burke risin to the top', 'Risin\' to the Top'))
      
    })


  })
});


