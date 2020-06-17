const axios = require('axios');
const errors = require('../../utils/errors');
const validate = require('../../utils/validate');
const tmpl = require('./template-model');
const Liquid = require('liquidjs').Liquid;

// Shortens a URL if found in a template's parameters.
const url = (object, parameters, url) => {
  return axios({
    method: 'post',
    url: `${process.env.SHORTURL_API_ENDPOINT}/url`,
    headers: {
      'x-api-key': process.env.SHORTURL_API_KEY
    },
    data: {
      Url: object[parameters][url]
    }
  }).then(response => {
    object[parameters][url] = response.data.ShortUrl;
    return object;
  });
};

const urls = async (objects, parameters, url) => {
  const paramsObjs = objects.filter(obj => validate.exists(obj, parameters));
  const urlObjs = paramsObjs.filter(obj => validate.exists(obj[parameters], url));
  console.log(urlObjs);
  const uniques = [...new Set(urlObjs.map(obj => obj[parameters][url]))].map(url => ({Url: url}));
  console.log(uniques);
  const shortUrlResponse = await axios({
    method: 'post',
    url: `${process.env.SHORTURL_API_ENDPOINT}/batch`,
    headers: {
      'x-api-key': process.env.SHORTURL_API_KEY
    },
    data: uniques
  }).then(response => {
    return objects.map(obj => {
      if (obj[parameters]) {
        if (obj[parameters][url]) {
          const shortObj = response.data.find(u => u.LongUrl == obj[parameters][url]);
          obj[parameters][url] = shortObj.ShortUrl;
        }
      }
      console.log(obj);
      return obj;
    })
  });
  console.log(shortUrlResponse);
  return shortUrlResponse;
}

// Check incoming submissions to ensure we have correct combinations of data.
// We want...
// One Content field. Or...
// One Template, TemplateId, or TemplateKey field AND one Parameters field.
const submission = (object, content, template, templateId, templateKey, params) => {
  if (validate.exists(object, content) || 
      (
        (
          validate.exists(object, template) || 
          validate.exists(object, templateId) || 
          validate.exists(object, templateKey)
        ) && 
        validate.exists(object, params)
      )
    ) {
    return object;
  } else {
    const errorTemplate = `Must contain either a *${content}* parameter or a set of *${template}*/*${templateId}*/*${templateKey}* and *${params}*.`;
    throw new errors.APIError("MALFORMED_PARAMETER", 400, object, errorTemplate);
  };
};

// Assembles the object's content.
// Hopefully you've already passed this object through a template(s) formatter.
// We're not going to repeat those field checks here.
const content = async (object, content, template, params) => {
  if (validate.exists(object, content)) {
    return object;
  } else {
    const engine = new Liquid();
    const tpl = engine.parse(object[template]);
    const cnt = await engine.render(tpl, object[params]);
    object[content] = cnt;
    return object;
  };
};




// Not exported.
// Processes a template from an object's given fields.
// If needed, it will contact the database to fetch the template.
// You can also pass in a cache if you know the database call would be redundant.
const assembler = async (object, content, template, templateId, templateKey, cache = {}) => {
  if (!validate.exists(object, template) && !validate.exists(object, content)) {
    if (validate.exists(object, templateId)) {
      if (validate.exists(cache, object[templateId])) {
        //console.log("Cache Hit");
        object[template] = cache[object[templateId]];
      } else {
        const rdsResponse = await tmpl.getById(object[templateId]);
        cache[rdsResponse.id] = rdsResponse.content;
        if (rdsResponse.key) {
          cache[rdsResponse.key] = rdsResponse.content;
        };
        object[template] = rdsResponse.content;
      };
    } else if (validate.exists(object, templateKey)) {
      if (validate.exists(cache, object[templateKey])) {
        //console.log("Cache Hit");
        object[template] = cache[object[templateKey]];
      } else {
        const rdsResponse = await tmpl.getByKey(object[templateKey]);
        cache[rdsResponse.id] = rdsResponse.content;
        cache[rdsResponse.key] = rdsResponse.content;
        object[template] = rdsResponse.content;
      };
    }; 
  };
  return [object, cache];
};

// Processes the template for a single object.
const assembly = async (object, content, template, templateId, templateKey) => {
  const [templatedObject, _] = await assembler(object, content, template, templateId, templateKey);
  return templatedObject;
};

// Processes templates for a series of objects.
// Notably, we're constructing a cache of templates already fetched from the database.
// This should significantly cut down on DB calls for big batches of similar messages.
const batchAssembly = (batch, content, template, templateId, templateKey) => {
  // Here we use reduce() to dynamically generate a huge Promise.then.then.then... chain.
  return batch.reduce((chain, object) => {
    return chain.then(collection => {
      return Promise.resolve(object) 
        .then(object => {
          try {
            return assembler(object, content, template, templateId, templateKey, collection.cache);
          } catch (e) {
            return [errors.format(e).report, collection.cache];
          };
        })
        .then(([object, cache]) => {
          collection.cache = cache;
          collection.messages.push(object);
          return collection;
        })
        .catch( e => { throw e; })
    });
  }, Promise.resolve({ 
    cache: {},
    messages: []
  })).then(collection => {
    return collection.messages;
  });
};

module.exports = {
  url,
  urls,
  submission,
  assembly,
  batchAssembly,
  content
}