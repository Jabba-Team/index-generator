# jabba-index
a tool to update jabba's jdk index using [DiscoAPI](https://github.com/foojayio/discoapi)

# Requirements

- NodeJs 20

#  GitHub Actions

A daily action will run to generate the index and push it to [the Jabba Index Repository](https://github.com/Jabba-Team/index)
Note GitHub will disable the action if there is no activity on the repo for 60 days. The job also uses an access token to push the new index, this will need rotating regularly.