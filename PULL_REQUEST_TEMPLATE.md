## Remove Replit files and references

This PR removes Replit-specific configuration from the repository.

Changes:
- Deleted replit.nix (replaced with a short placeholder file to show intent in the PR)
- Removed .replit and replit.nix lines from .dockerignore

Rationale:
- The project no longer uses Replit; these files caused unnecessary clutter and possible confusion.

If you want me to remove the placeholder replit.nix entirely before merging, I can do that in a follow-up commit or after review.
