import axios from 'axios';

const EMBEDDING_SERVER = process.env.EMBEDDING_SERVER || 'http://localhost:8001';
const SIMILARITY_THRESHOLD = 0.70;

async function compareIssues(newText, oldTexts) {
  try {
    console.log(`🔗 Calling embedding server: ${EMBEDDING_SERVER}/compare`);
    const response = await axios.post(`${EMBEDDING_SERVER}/compare`, {
      new_text: newText,
      old_texts: oldTexts
    });
    console.log('✓ Embedding server responded');
    return response.data;
  } catch (error) {
    console.error('❌ Embedding service error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    throw error;
  }
}

export default (app) => {
  console.log('🤖 EchoFinder Bot initialized');

  app.on('issues.opened', async (context) => {
    const issue = context.payload.issue;
    const owner = context.payload.repository.owner.login;
    const repo = context.payload.repository.name;

    console.log(`\n${'='.repeat(50)}`);
    console.log(`📋 NEW ISSUE DETECTED`);
    console.log(`Repository: ${owner}/${repo}`);
    console.log(`Issue #${issue.number}: ${issue.title}`);
    console.log(`${'='.repeat(50)}\n`);

    try {
      // Get all open issues
      console.log('📡 Fetching all open issues from repository...');
      const issuesResponse = await context.octokit.issues.listForRepo({
        owner,
        repo,
        state: 'open',
        per_page: 100
      });

      const openIssues = issuesResponse.data.filter(
        i => i.number !== issue.number && !i.pull_request
      );

      console.log(`✓ Found ${openIssues.length} other open issues`);

      if (openIssues.length === 0) {
        console.log('ℹ️ No other open issues to compare. Skipping...');
        return;
      }

      // Prepare texts
      const newText = `${issue.title}\n${issue.body || ''}`;
      const oldTexts = openIssues.map(i => `${i.title}\n${i.body || ''}`);

      console.log(`\n🔍 Starting similarity comparison...`);
      console.log(`New issue text length: ${newText.length} chars`);
      console.log(`Comparing against ${oldTexts.length} issues\n`);

      // Get similarity scores
      const result = await compareIssues(newText, oldTexts);

      if (result.error) {
        console.error('❌ Error from embedding service:', result.error);
        return;
      }

      const bestScore = result.best_score;
      const bestMatchIndex = result.best_match_index;
      const bestMatchIssue = openIssues[bestMatchIndex];

      console.log(`\n🎯 RESULTS:`);
      console.log(`Best match: Issue #${bestMatchIssue.number}`);
      console.log(`Title: "${bestMatchIssue.title}"`);
      console.log(`Score: ${(bestScore * 100).toFixed(1)}%`);
      console.log(`Threshold: ${(SIMILARITY_THRESHOLD * 100).toFixed(1)}%`);

      if (bestScore > SIMILARITY_THRESHOLD) {
          console.log(`\n✅ SCORE ABOVE THRESHOLD - Posting comment...\n`);

          const comment = `🔍 **Potential Duplicate Found**\n\n` +
            `This issue is very similar to **#${bestMatchIssue.number}**: "${bestMatchIssue.title}"\n\n` +
            `📊 **Similarity Score:** ${(bestScore * 100).toFixed(1)}%\n\n` +
            `Please review if this is a duplicate. If confirmed, you can close this issue.`;

          await context.octokit.issues.createComment({
            owner,
            repo,
            issue_number: issue.number,
            body: comment
          });

          console.log('✅ Comment posted successfully');

          // Add label to NEW issue (the one just created)
          try {
            await context.octokit.issues.addLabels({
              owner,
              repo,
              issue_number: issue.number,
              labels: ['duplicate?']
            });
            console.log('🏷️ Label "duplicate?" added to new issue #' + issue.number);
          } catch (labelError) {
            console.log('ℹ️ Could not add label to new issue (label may not exist in repo)');
          }

          // Add label to ORIGINAL issue (the most similar one)
          try {
            await context.octokit.issues.addLabels({
              owner,
              repo,
              issue_number: bestMatchIssue.number,
              labels: ['has-duplicates']
            });
            console.log('🏷️ Label "has-duplicates" added to original issue #' + bestMatchIssue.number);
          } catch (labelError) {
            console.log('ℹ️ Could not add label to original issue (label may not exist in repo)');
          }

          // Post a notice on the ORIGINAL issue to inform maintainers
          try {
            const originalNotice = `🔔 Note: A new issue (#${issue.number}) was opened that appears to be a possible duplicate of this issue.\n\n` +
              `**New issue title:** "${issue.title}"\n` +
              `📊 **Similarity:** ${(bestScore * 100).toFixed(1)}%\n\n` +
              `Please review and consider merging, closing, or cross-referencing the issues.`;
            await context.octokit.issues.createComment({
              owner,
              repo,
              issue_number: bestMatchIssue.number,
              body: originalNotice
            });
            console.log('💬 Comment posted to original issue #' + bestMatchIssue.number);
          } catch (origCommentError) {
            console.log('ℹ️ Could not post comment to original issue:', origCommentError.message);
          }

        } else {
          console.log(`\n⏭️ Score below threshold (${(bestScore * 100).toFixed(1)}% < ${(SIMILARITY_THRESHOLD * 100).toFixed(1)}%)`);
          console.log('No comment posted.');
        }

      console.log(`\n${'='.repeat(50)}\n`);

    } catch (error) {
      console.error('❌ ERROR processing issue:', error.message);
      console.error(error);
    }
  });
};