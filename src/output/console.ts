import chalk from 'chalk';
import { ValidationResult, ValidationCheck, CLIOptions, LiveTestResult } from '../types';

export class ConsoleOutput {
  display(result: ValidationResult, input: string, options: CLIOptions): void {
    console.log(); // Empty line

    // Header with status
    this.displayHeader(result, input);
    
    // Summary metrics  
    this.displaySummary(result);
    
    // Live test results (if performed)
    if (result.liveTest) {
      this.displayLiveTest(result.liveTest);
    }
    
    // Detailed results unless errors-only
    if (!options.errorsOnly) {
      this.displayValidations(result);
    }
    
    // Issues (errors, warnings)
    this.displayIssues(result);
    
    // Suggestions
    if (!options.errorsOnly && result.suggestions.length > 0) {
      this.displaySuggestions(result);
    }
    
    // What's next guidance
    this.displayNextSteps(result);
  }

  private displayHeader(result: ValidationResult, input: string): void {
    const status = result.success 
      ? chalk.green('✅ A2A AGENT VALIDATION PASSED')
      : chalk.red('❌ A2A AGENT VALIDATION FAILED');
    
    console.log(status);
    console.log(chalk.gray(`Agent: ${input}`));
    
    // Always display detailed scoring breakdown
    if (result.scoringResult) {
      this.displayDetailedScores(result.scoringResult);
    }
    
    if (result.versionInfo) {
      const version = result.versionInfo.detectedVersion || 'undefined';
      const strictness = result.versionInfo.strictness;
      console.log(chalk.gray(`Version: ${version} (Strictness: ${strictness})`));
      
      if (result.versionInfo.compatibility && !result.versionInfo.compatibility.compatible) {
        const mismatchCount = result.versionInfo.compatibility.mismatches.length;
        console.log(chalk.yellow(`⚠️  Version Compatibility Issues: ${mismatchCount} detected`));
      }
    }
    
    console.log();
  }

  private displaySummary(result: ValidationResult): void {
    if (result.validations.length === 0) return;

    const total = result.validations.length;
    const passed = result.validations.filter(v => v.status === 'passed').length;
    const failed = result.validations.filter(v => v.status === 'failed').length;
    const warnings = result.warnings.length;
    
    console.log(chalk.cyan('🔍 VALIDATION SUMMARY:'));
    console.log(`  📊 ${total} checks performed: ${chalk.green(passed + ' passed')}, ${chalk.red(failed + ' failed')}, ${chalk.yellow(warnings + ' warnings')}`);
    
    // Calculate total duration if available
    const totalDuration = result.validations.reduce((sum, v) => sum + (v.duration || 0), 0);
    if (totalDuration > 0) {
      console.log(`  ⏱️  Completed in ${totalDuration}ms`);
    }
    
    console.log();
  }

  private displayValidations(result: ValidationResult): void {
    if (result.validations.length === 0) return;

    console.log(chalk.cyan.bold('🔍 VALIDATIONS PERFORMED:'));
    
    result.validations.forEach((validation: ValidationCheck) => {
      const statusIcon = validation.status === 'passed' ? '✅' : 
                        validation.status === 'failed' ? '❌' : '⏭️';
      const statusColor = validation.status === 'passed' ? chalk.green :
                         validation.status === 'failed' ? chalk.red : chalk.gray;
      
      console.log(statusColor(`${statusIcon} ${validation.name}`));
      
      if (validation.details) {
        console.log(chalk.gray(`   ${validation.details}`));
      }
      
      if (validation.duration) {
        console.log(chalk.gray(`   Duration: ${validation.duration}ms`));
      }
    });
    
    console.log();
  }

  private displayLiveTest(liveTest: LiveTestResult): void {
    console.log(chalk.cyan.bold('🔗 LIVE ENDPOINT TESTING:'));
    
    if (liveTest.success) {
      console.log(chalk.green(`✅ Live test passed`));
      console.log(chalk.gray(`   Endpoint: ${liveTest.endpoint}`));
      console.log(chalk.gray(`   Response Time: ${liveTest.responseTime}ms`));
      
      if (liveTest.response) {
        const responseKind = liveTest.response.kind || 'unknown';
        console.log(chalk.gray(`   Response Type: ${responseKind}`));
      }
    } else {
      console.log(chalk.red(`❌ Live test failed`));
      console.log(chalk.gray(`   Endpoint: ${liveTest.endpoint}`));
      
      liveTest.errors.forEach(error => {
        console.log(chalk.red(`   • ${error}`));
      });
    }
    
    console.log();
  }

  private displayIssues(result: ValidationResult): void {
    // Errors
    if (result.errors.length > 0) {
      console.log(chalk.red.bold(`🔍 ERRORS FOUND (${result.errors.length}):`));
      result.errors.forEach(error => {
        console.log(chalk.red(`❌ ${error.code}: ${error.message}`));
        if (error.field) {
          console.log(chalk.gray(`   Field: ${error.field}`));
        }
      });
      console.log();
    }

    // Warnings
    if (result.warnings.length > 0) {
      console.log(chalk.yellow.bold(`⚠️  WARNINGS (${result.warnings.length}):`));
      result.warnings.forEach(warning => {
        console.log(chalk.yellow(`⚠️  ${warning.code}: ${warning.message}`));
        if (warning.field) {
          console.log(chalk.gray(`   Field: ${warning.field}`));
        }
      });
      console.log();
    }
  }

  private displaySuggestions(result: ValidationResult): void {
    console.log(chalk.blue.bold(`💡 SUGGESTIONS (${result.suggestions.length}):`));
    result.suggestions.forEach(suggestion => {
      console.log(chalk.blue(`💡 ${suggestion.message}`));
      if (suggestion.impact) {
        console.log(chalk.gray(`   Impact: ${suggestion.impact}`));
      }
    });
    console.log();
  }

  private displayDetailedScores(scoringResult: any): void {
    console.log();
    console.log(chalk.cyan.bold('📊 SCORING BREAKDOWN:'));
    console.log();
    
    // Compliance Score
    const complianceColor = this.getScoreColor(scoringResult.compliance.total);
    console.log(complianceColor(`  ✓ Spec Compliance: ${scoringResult.compliance.total}/100 ${scoringResult.compliance.rating}`));
    console.log(chalk.gray(`    └─ Core Fields:       ${scoringResult.compliance.breakdown.coreFields.score}/60`));
    console.log(chalk.gray(`    └─ Skills Quality:    ${scoringResult.compliance.breakdown.skillsQuality.score}/20`));
    console.log(chalk.gray(`    └─ Format:            ${scoringResult.compliance.breakdown.formatCompliance.score}/15`));
    console.log(chalk.gray(`    └─ Data Quality:      ${scoringResult.compliance.breakdown.dataQuality.score}/5`));
    
    // Trust Score
    const trustColor = this.getScoreColor(scoringResult.trust.total);
    console.log();
    console.log(trustColor(`  ✓ Trust: ${scoringResult.trust.total}/100 ${scoringResult.trust.rating}`));
    if (scoringResult.trust.confidenceMultiplier < 1.0) {
      console.log(chalk.yellow(`    ⚠️  Confidence: ${scoringResult.trust.confidenceMultiplier}x (Raw: ${scoringResult.trust.rawScore})`));
    }
    console.log(chalk.gray(`    └─ Signatures:        ${scoringResult.trust.breakdown.signatures.score}/40 ${scoringResult.trust.breakdown.signatures.tested ? '' : '(Not Tested)'}`));
    console.log(chalk.gray(`    └─ Provider:          ${scoringResult.trust.breakdown.provider.score}/25`));
    console.log(chalk.gray(`    └─ Security:          ${scoringResult.trust.breakdown.security.score}/20`));
    console.log(chalk.gray(`    └─ Documentation:     ${scoringResult.trust.breakdown.documentation.score}/15`));
    
    // Availability Score
    console.log();
    if (scoringResult.availability.tested && scoringResult.availability.total !== null) {
      const availColor = this.getScoreColor(scoringResult.availability.total);
      console.log(availColor(`  ✓ Availability: ${scoringResult.availability.total}/100 ${scoringResult.availability.rating}`));
      console.log(chalk.gray(`    └─ Primary Endpoint:  ${scoringResult.availability.breakdown.primaryEndpoint.score}/50`));
      console.log(chalk.gray(`    └─ Transport Support: ${scoringResult.availability.breakdown.transportSupport.score}/30`));
      console.log(chalk.gray(`    └─ Response Quality:  ${scoringResult.availability.breakdown.responseQuality.score}/20`));
    } else {
      console.log(chalk.gray(`  ⏭️  Availability: Not Tested`));
      if (scoringResult.availability.notTestedReason) {
        console.log(chalk.gray(`    └─ ${scoringResult.availability.notTestedReason}`));
      }
    }
    
    // Recommendation
    if (scoringResult.recommendation) {
      console.log();
      console.log(chalk.blue.bold('💡 RECOMMENDATION:'));
      const recommendations = scoringResult.recommendation.split('\n');
      recommendations.forEach((rec: string) => {
        console.log(`  ${rec}`);
      });
    }
    
    console.log();
  }
  
  private getScoreColor(score: number): typeof chalk.green {
    if (score >= 90) return chalk.green;
    if (score >= 75) return chalk.yellow;
    if (score >= 60) return chalk.magenta;
    return chalk.red;
  }

  private displayNextSteps(result: ValidationResult): void {
    if (result.errors.length > 0) {
      console.log(chalk.blue.bold('💻 NEXT STEPS:'));
      console.log(chalk.blue('1. Fix the errors listed above'));
      console.log(chalk.blue('2. Re-run validation to confirm fixes'));
      
      if (result.suggestions.length > 0) {
        console.log(chalk.blue('3. Consider applying the suggestions for improvements'));
      }
    } else if (result.warnings.length > 0) {
      console.log(chalk.green.bold('🎉 Great! Your agent is valid with minor improvements available.'));
      console.log(chalk.blue('💡 Consider addressing the warnings above for optimal compliance.'));
    } else {
      console.log(chalk.green.bold('🏆 Perfect! Your agent passes all validations.'));
      console.log(chalk.blue('🚀 Your agent is ready for deployment!'));
    }
    
    console.log();
  }
}