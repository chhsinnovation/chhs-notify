const batch = require('./batch-model');
const message = require('../message');
const errors = require('../../utils/errors');

const processGet = async event => {
  // Get preliminary info on the batch.
  const batchRdsResponse = await batch.getById(event.pathParameters.id);

  // Format the basic batch info for the eventual apiResponse.
  let apiResponse = {
    Batch: {
      Id: batchRdsResponse.id,
      Url: `${process.env.URL_BASE}/batches/${batchRdsResponse.id}`,
      ProcessingStatus: batchRdsResponse.processing_status,
      ProcussingNote: batchRdsResponse.processing_note,
      Description: batchRdsResponse.description,
      CreatedTime: batchRdsResponse.created_at,
      QueuedTime: batchRdsResponse.queued_at,
      ProcessedTime: batchRdsResponse.processed_at,
      VerifiedTime: batchRdsResponse.verified_at,
    }
  };

  // If there are messages attached to this batch, we go about assembling page and message info.
  if (batchRdsResponse.message_count > 0) {
    const page = parseInt(event.queryStringParameters ? event.queryStringParameters.page : 1);
    const limit = 500;
    const offset = ((page - 1) * limit);
    const lastPage = Math.ceil(batchRdsResponse.message_count/limit);
    
    // If the requested page is too high (empty) for this batch, we need to throw a special error. 
    if (offset >= batchRdsResponse.message_count) {
      throw new errors.APIError(
        "PAGE_ERROR", 404, { BatchId: batchRdsResponse.id, Page: page },
        `This page number is too high for this batch. The total message count for this batch is ${batchRdsResponse.message_count}, which means the last page is ${lastPage}.`
      );
    }

    // Assemble some information about the current page.
    const pageResponse = {
      CurrentPage: page,
      LastPage: lastPage,
      MessageLimitPerPage: limit,
      MessagesInPage: limit,
      MessagesInBatch: batchRdsResponse.message_count,
      StartIndex: (offset + 1)
    };

    // If we're not on the last page, we need a link to the NextPage.
    // Else, if we are on the LastPage, we need to change some pageResponse details because page volume may be smaller.
    if ((page * limit) < batchRdsResponse.message_count) {
      pageResponse.EndIndex = (page * limit);
      pageResponse.NextPage = `${process.env.URL_BASE}/batches/${batchRdsResponse.id}?page=${(page + 1)}`
    } else {
      pageResponse.EndIndex = batchRdsResponse.message_count;
      pageResponse.MessagesInPage = (batchRdsResponse.message_count - offset)
    };

    // We don't need a PreviousPage link on the first page, so only add it to later pages.
    if (page > 1) {
      pageResponse.PreviousPage = `${process.env.URL_BASE}/batches/${batchRdsResponse.id}?page=${(page - 1)}`
    };

    // Finally, fetch this batch's messages from the database.
    const msgsRdsResponse = await batch.getMessagesById(batchRdsResponse.id, offset, limit);
    
    // Add Page info and Messages to the apiResponse.
    apiResponse.Page = pageResponse;
    apiResponse.Messages = msgsRdsResponse.map(msg => {
      return message.format.rdsRecord(msg);
    });
  };

  // At last, return the whole stonking thing to the client.
  return apiResponse;
};

module.exports = {
  processGet
}