//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// ** This file is automatically generated by gapic-generator-typescript. **
// ** https://github.com/googleapis/gapic-generator-typescript **
// ** All changes to this file may be overwritten. **

'use strict';

const {assert} = require('chai');
const path = require('path');
const cp = require('child_process');
const {after, before, describe, it} = require('mocha');
const {Storage} = require('@google-cloud/storage');
const {
  StorageTransferServiceClient,
} = require('@google-cloud/storage-transfer');
const {v4: uuidv4} = require('uuid');

const execSync = cmd => cp.execSync(cmd, {encoding: 'utf-8'});

const cwd = path.join(__dirname, '..');

const client = new StorageTransferServiceClient();
const storage = new Storage();
const sourceBucketName = `nodejs-sts-source${uuidv4()}`;
const sinkBucketName = `nodejs-sts-sink${uuidv4()}`;
const sourceBucket = storage.bucket(sourceBucketName);
const sinkBucket = storage.bucket(sinkBucketName);

after(async () => {
  await sourceBucket.delete().catch(console.error);
  await sinkBucket.delete().catch(console.error);
});

describe('Quickstart', () => {
  let projectId;

  before(async () => {
    projectId = await storage.getProjectId();
    await sourceBucket.create();
    await sinkBucket.create();
  });

  async function grantStsPermissions(projectId, bucket) {
    const request = {projectId: projectId};
    const serviceAccount = await client.getGoogleServiceAccount(request);
    const email = serviceAccount[0].accountEmail;

    const objectViewer = 'roles/storage.objectViewer';
    const bucketReader = 'roles/storage.legacyBucketReader';
    const bucketWriter = 'roles/storage.legacyBucketWriter';
    const members = ['serviceAccount:' + email];

    const [policy] = await bucket.iam.getPolicy({requestedPolicyVersion: 3});

    policy.bindings.push({
      role: objectViewer,
      members: members,
    });

    policy.bindings.push({
      role: bucketReader,
      members: members,
    });

    policy.bindings.push({
      role: bucketWriter,
      members: members,
    });

    await bucket.iam.setPolicy(policy);
  }

  it('should run quickstart', async () => {
    await grantStsPermissions(projectId, sourceBucket);
    await grantStsPermissions(projectId, sinkBucket);
    const output = execSync(
      `node ./quickstart.js ${projectId} ${sourceBucketName} ${sinkBucketName}`,
      {cwd}
    );
    console.log(output);
    assert.include(output, 'transferJobs/');

    // If it ran successfully and a job was created, delete it to clean up
    const transferJobName = output.match(/transferJobs.*/)[0];
    const deleteRequest = {
      projectId: projectId,
      jobName: transferJobName,
      transferJob: {
        name: transferJobName,
        status: 'DELETED',
      },
    };
    await client.updateTransferJob(deleteRequest);
  });
});
