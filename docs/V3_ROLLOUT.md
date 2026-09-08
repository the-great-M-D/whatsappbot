# V3 rollout sequence

Database migrations must complete before V3 starts. Baseline RBAC is seeded separately. The V3 API then starts with authenticated dashboard access and the instance manager reconciles desired state.

Existing V2 startup remains the default until the V3 cutover is explicitly enabled.
