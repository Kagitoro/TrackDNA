from __future__ import annotations

import time


def main() -> None:
    while True:
        print("TrackDNA audio worker idle: queue integration pending", flush=True)
        time.sleep(30)


if __name__ == "__main__":
    main()
