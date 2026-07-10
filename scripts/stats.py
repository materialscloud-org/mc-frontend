import os
from datetime import datetime

import matplotlib.pyplot as plt
import numpy as np
import pycountry
import requests


class PlausibleApiCall:
    def __init__(self, url, plausible_header, site):
        self.url = url
        self.plausible_header = plausible_header
        self.title = site["title"]
        self.hostname = site["hostname"].replace(".", "_")

    def get_data(self):
        response = requests.get(self.url, headers=self.plausible_header)
        if response.status_code == 200:
            print("The request was a success!")
        elif response.status_code == 404:
            print("Result not found!")
        return response.json()

    def autopct_round(self, values):
        total = sum(values)
        percentages = [100 * v / total for v in values]
        floored = [int(p) for p in percentages]
        remainder = [p - f for p, f in zip(percentages, floored)]

        # Number of percentages to increase to reach 100%
        to_add = 100 - sum(floored)
        # Add 1 to the top 'to_add' remainders
        for i in np.argsort(remainder)[-to_add:]:
            floored[i] += 1

        def func(pct, allvals):
            # Find index of pct in original percentages (approximate match)
            # Instead of pct, we just cycle through floored values
            return f"{floored.pop(0)}%"

        return func

    # get full country name from ISO alpha-2 code
    def get_country_name(self, code):
        try:
            return pycountry.countries.get(alpha_2=code).name
        except:
            return code  # fallback to code if not found

    def print_country_name(self, country_codes):
        countries = []
        for country in country_codes:
            countries.append(pac.get_country_name(country))

        countries_names = ""
        for country in sorted(countries):
            countries_names += pac.get_country_name(country) + ", "
        print(f"{countries_names}")

    def plot_stats_visitors(self, site, data):
        keys = ["date", "visitors"]
        D = {d[keys[0]].rsplit("-", 1)[0]: d[keys[1]] for d in data}

        # plt.rcParams['figure.figsize'] = [10, 10]
        plt.bar(range(len(D)), list(D.values()), align="center")
        plt.title(site["title"], fontsize=22)
        plt.ylabel("Number of unique visitors", fontsize=16)
        plt.xticks(range(len(D)), list(D.keys()), rotation=30, ha="right")

        timestamp = datetime.now().strftime("%Y_%m_%d_%H%M")
        plt.savefig(f"figures/{timestamp}_{site['hostname']}_n_visits_months.png")
        plt.clf()

    def pie_stats_visitors_country(self, site, data):
        # get top 8 countries
        pie_data = data[0:9]

        others = 0
        for d in data[9:]:
            others += d["visitors"]
        pie_data.append({"country": "others", "visitors": others})

        labels = [d["country"] for d in pie_data]
        data = [d["visitors"] for d in pie_data]

        # colors mapping
        colors = {
            "CN": "C1",
            "US": "C2",
            "IN": "C3",
            "JP": "C4",
            "SG": "C5",
            "others": "C6",
        }

        # set color in case country not in the mapping
        for label in labels:
            if label not in colors.keys():
                latest_color = [int(v.split("C")[1]) for k, v in colors.items()]
                colors[label] = "C" + str(max(latest_color) + 1)

        # make percentages with correct rounding
        data_copy = data.copy()
        autopct_func = self.autopct_round(data_copy)

        # make plot
        fig, ax = plt.subplots(figsize=(10, 8))
        wedges, texts, autotexts = ax.pie(
            data,
            labels=labels,
            colors=[colors[key] for key in labels],
            autopct=lambda pct: autopct_func(pct, data_copy),
        )
        # ax.pie(data, labels=labels, colors=[colors[key] for key in labels], autopct='%1.0f%%')
        # ax.pie(data, labels=labels, autopct='%.1f%%')

        # change font size of percentage values
        for autotext in autotexts:
            autotext.set_fontsize(12)
        for text in texts:
            text.set_fontsize(12)

        plt.title(self.title, fontsize=20)

        # save plot
        timestamp = datetime.now().strftime("%Y_%m_%d_%H%M")
        plt.savefig(
            f"figures/{timestamp}_{site['hostname']}_piechart_n_visits_country.png"
        )
        plt.clf()

    def pie_stats_visitors_region(self, site, data):
        """This function is to plot visitors grouping EU countries and associted countries"""

        # Initialize counters
        visitors_summary = {
            "EU_HE": 0,
        }

        # Sum visitors based on group membership
        for entry in data:
            code = entry["country"]
            count = entry["visitors"]
            if code in EU_HE:
                visitors_summary["EU_HE"] += count
            else:
                visitors_summary[code] = count

        sorted_data = dict(
            sorted(visitors_summary.items(), key=lambda item: item[1], reverse=True)
        )

        # get top 6 regions
        pie_data = dict(list(sorted_data.items())[:6])

        sum_visitors = 0
        for k, d in sorted_data.items():
            sum_visitors += d

        top_sum_visitors = 0
        for k, d in pie_data.items():
            top_sum_visitors += d

        others = sum_visitors - top_sum_visitors

        # print list of "others" countries
        country_codes = [code for code, _ in list(sorted_data.items())[6:]]
        print("others: ")
        self.print_country_name(country_codes)

        pie_data["others"] = others

        labels = [
            "EUROPE and associated countries" if k == "EU_HE" else k
            for k in pie_data.keys()
        ]
        data = [d for k, d in pie_data.items()]

        data_copy = data.copy()
        autopct_func = self.autopct_round(data_copy)

        # colors mapping
        colors = {
            "EUROPE and associated countries": "C0",
            "CN": "C1",
            "US": "C2",
            "IN": "C3",
            "JP": "C4",
            "SG": "C5",
            "others": "C6",
        }

        # set color in case country not in the mapping
        for label in labels:
            if label not in colors.keys():
                latest_color = [int(v.split("C")[1]) for k, v in colors.items()]
                colors[label] = "C" + str(max(latest_color) + 1)

        fig, ax = plt.subplots(figsize=(10, 8))
        wedges, texts, autotexts = ax.pie(
            data,
            labels=labels,
            colors=[colors[key] for key in labels],
            autopct=lambda pct: autopct_func(pct, data_copy),
        )
        # ax.pie(data, labels=labels, autopct='%.1f%%')
        # ax.pie(data, labels=labels, autopct='%d%%')

        # Change font size of percentage values
        for autotext in autotexts:
            autotext.set_fontsize(12)
        for text in texts:
            text.set_fontsize(12)

        plt.title(site["title"], fontsize=20)

        # get current date and time as string: YYYY_MM_DD_HHMM
        timestamp = datetime.now().strftime("%Y_%m_%d_%H%M")
        plt.savefig(
            f"figures/{timestamp}_{site['hostname']}_piechart_n_visits_regions.png"
        )
        plt.clf()


if __name__ == "__main__":
    EU = [
        "DE",  # Germany
        "IT",  # Italy
        "FR",  # France
        "ES",  # Spain
        "BE",  # Belgium
        "NL",  # Netherlands
        "AT",  # Austria
        "SE",  # Sweden
        "DK",  # Denmark
        "PL",  # Poland
        "PT",  # Portugal
        "FI",  # Finland
        "IE",  # Ireland
        "GR",  # Greece
        "CZ",  # Czechia
        "HR",  # Croatia
        "LU",  # Luxembourg
        "LV",  # Latvia
        "SI",  # Slovenia
        "HU",  # Hungary
        "RO",  # Romania
        "SK",  # Slovakia
        "BG",  # Bulgaria
        "LT",  # Lithuania
        "EE",  # Estonia
        "CY",  # Cyprus
    ]

    # HE_ASSOCIATED list taken from
    # https://ec.europa.eu/info/funding-tenders/opportunities/docs/2021-2027/common/guidance/list-3rd-country-participation_horizon-euratom_en.pdf
    HE_ASSOCIATED = [
        "AL",  # Albania
        "AM",  # Armenia
        "BA",  # Bosnia and Herzegovina
        "EG",  # Egypt
        "FO",  # Faroe Islands
        "GE",  # Georgia
        "IS",  # Iceland
        "XK",  # Kosovo
        "MD",  # Moldova
        "ME",  # Montenegro
        "MK",  # North Macedonia
        "NO",  # Norway
        "RS",  # Serbia
        "TR",  # Türkiye
        "UA",  # Ukraine
        "GB",  # United Kingdom
        "IL",  # Israel
        "TN",  # Tunisia
        "NZ",  # New Zealand (Pillar II)
        "MA",  # Morocco
        "KR",  # South Korea (Pillar II)
        "CA",  # Canada (Pillar II)
        "CH",  # Switzerland (partial or upcoming full association)
    ]  # Horizon Europe associated countries

    EU_HE = EU + HE_ASSOCIATED

    # Plots using the api
    # take the token from the plausible web page in the section API keys (https://plausible.io/settings)
    token = os.getenv("PLAUSIBLE_API_TOKEN")
    plausible_header = {"Authorization": f"Bearer {token}"}

    # choose the time period
    period = "12mo"

    sites = [
        {
            "hostname": "plausible-rollup.materialscloud.org",
            "title": "Materials Cloud (all)",
        },
        {"hostname": "archive.materialscloud.org", "title": "Materials Cloud Archive"},
    ]

    for site in sites:
        url = f"https://plausible.io/api/v1/stats/timeseries?site_id={site['hostname']}&period={period}"
        pac = PlausibleApiCall(url, plausible_header, site)
        data = pac.get_data()

        # make plot n. of visits per month
        pac.plot_stats_visitors(site, data["results"])

        url = f"https://plausible.io/api/v1/stats/breakdown?site_id={site['hostname']}&period={period}&property=visit:country"
        pac = PlausibleApiCall(url, plausible_header, site)
        data = pac.get_data()

        # make plot n. of visits per country/region
        pac.pie_stats_visitors_region(site, data["results"])
        pac.pie_stats_visitors_country(site, data["results"])

        # print list of countries
        print("EUROPE:")
        pac.print_country_name(EU)
        print("Associated countries:")
        pac.print_country_name(HE_ASSOCIATED)
