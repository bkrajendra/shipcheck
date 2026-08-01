import { defineTool } from '@flue/runtime';
import * as v from 'valibot';

const ReadinessReport = v.object({
  ready: v.boolean(),
  blockers: v.array(v.string()),
  warnings: v.array(v.string()),
  summary: v.string(),
});

export const submitReadinessReport = defineTool({
  name: 'submit_readiness_report',
  description:
    'Submit the final release-readiness verdict for the investigated repository. Call this exactly once, after finishing the release-checklist investigation, to end the task with a structured result. Never answer with plain text instead of calling this tool.',
  input: ReadinessReport,
  output: ReadinessReport,
  async run({ data }) {
    if (data.ready && data.blockers.length > 0) {
      // Thrown errors become a tool-error result the model sees and can act
      // on — force the model to reconcile the verdict rather than silently
      // accepting a self-contradictory report.
      throw new Error(
        `Inconsistent report: ready=true but ${data.blockers.length} blocker(s) were listed (${data.blockers.join('; ')}). ` +
          'A release with open blockers cannot be ready. Set ready to false, or remove the items that do not actually block release.',
      );
    }
    return {
      output: {
        ready: data.ready,
        blockers: data.blockers,
        warnings: data.warnings,
        summary: data.summary,
      },
      terminate: true,
    };
  },
});
